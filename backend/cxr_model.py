"""Shared training/evaluation/serving definitions for the 14-finding workbench."""
import io
import json
from pathlib import Path

import numpy as np
import torch
from PIL import Image, UnidentifiedImageError
from torch import nn
from torch.utils.data import Dataset
from torchvision.models import (DenseNet121_Weights, ResNet50_Weights,
    densenet121, resnet50)
from torchvision.transforms.functional import normalize, pil_to_tensor

LABELS=['Atelectasis','Cardiomegaly','Consolidation','Edema','Effusion','Emphysema',
        'Fibrosis','Hernia','Infiltration','Mass','Nodule','Pleural_Thickening',
        'Pneumonia','Pneumothorax']
MEAN=[0.485,0.456,0.406]
STD=[0.229,0.224,0.225]
IMAGE_SIZE=224


def image_tensor(image):
    image=image.convert('L')
    if image.size!=(IMAGE_SIZE,IMAGE_SIZE):
        image=image.resize((IMAGE_SIZE,IMAGE_SIZE),Image.Resampling.LANCZOS,reducing_gap=3.0)
    tensor=pil_to_tensor(image).float().div_(255).repeat(3,1,1)
    return normalize(tensor,MEAN,STD)


def input_tensor(payload):
    if not isinstance(payload,(bytes,bytearray)) or not 0<len(payload)<=20*1024*1024:
        raise ValueError('Provide a PNG or JPEG image no larger than20 MiB')
    try:
        with Image.open(io.BytesIO(payload)) as image:
            if image.format not in {'PNG','JPEG'}:
                raise ValueError('Only PNG and JPEG inputs are supported')
            if min(image.size)<32 or max(image.size)>8192 or image.width*image.height>32_000_000:
                raise ValueError('Unsupported image dimensions')
            image.load()
            return image_tensor(image)
    except (UnidentifiedImageError,OSError,Image.DecompressionBombError) as error:
        raise ValueError('Input could not be decoded as a supported image') from error


class ChestDataset(Dataset):
    def __init__(self,frame,image_directory):
        self.frame=frame.reset_index(drop=True).copy()
        self.image_directory=Path(image_directory)
        self.targets=self.frame[LABELS].to_numpy(dtype=np.float32)
        if not np.isin(self.targets,[0,1]).all():raise ValueError('Targets must be binary and complete')
        if not self.frame.image_id.is_unique:raise ValueError('Duplicate dataset image IDs')
    def __len__(self):return len(self.frame)
    def __getitem__(self,index):
        row=self.frame.iloc[index]
        with Image.open(self.image_directory/row.image_id) as image:
            tensor=image_tensor(image)
        return tensor,torch.from_numpy(self.targets[index]),row.image_id


def build_model(name,pretrained=True):
    if name=='resnet50':
        model=resnet50(weights=ResNet50_Weights.IMAGENET1K_V2 if pretrained else None)
        model.fc=nn.Linear(model.fc.in_features,len(LABELS))
    elif name=='densenet121':
        model=densenet121(weights=DenseNet121_Weights.IMAGENET1K_V1 if pretrained else None)
        model.classifier=nn.Linear(model.classifier.in_features,len(LABELS))
    else:raise ValueError(f'Unsupported architecture: {name}')
    return model


def classifier(model,name):
    return model.fc if name=='resnet50' else model.classifier


def positive_weights(targets):
    targets=np.asarray(targets,dtype=np.float64)
    positives=targets.sum(axis=0)
    if targets.ndim!=2 or (positives<=0).any() or (positives>=len(targets)).any():
        raise ValueError('Every training finding requires both positive and negative examples')
    return np.clip(np.sqrt((len(targets)-positives)/positives),1,10).astype(np.float32)


def validate_scores(targets,scores):
    targets=np.asarray(targets)
    scores=np.asarray(scores,dtype=np.float64)
    if targets.ndim!=2 or scores.shape!=targets.shape or len(targets)==0:
        raise ValueError('Targets and scores must be matching nonempty[N,L] arrays')
    if not np.isin(targets,[0,1]).all() or not np.isfinite(scores).all() or (scores<0).any() or (scores>1).any():
        raise ValueError('Invalid binary targets or model scores')
    return targets.astype(np.int8),scores


def select_thresholds(targets,scores):
    from sklearn.metrics import precision_recall_curve
    targets,scores=validate_scores(targets,scores)
    thresholds=[]
    for index in range(targets.shape[1]):
        y=targets[:,index]
        if np.unique(y).size<2:
            thresholds.append(0.5);continue
        precision,recall,candidates=precision_recall_curve(y,scores[:,index])
        f1=2*precision[:-1]*recall[:-1]/np.maximum(precision[:-1]+recall[:-1],1e-12)
        best=np.flatnonzero(np.isclose(f1,f1.max(),rtol=0,atol=1e-12))[-1]
        thresholds.append(float(candidates[best]))
    return np.asarray(thresholds,dtype=np.float64)


def compute_metrics(targets,scores,thresholds,labels=LABELS):
    from sklearn.metrics import (average_precision_score, confusion_matrix, f1_score,
        precision_score, recall_score, roc_auc_score)
    targets,scores=validate_scores(targets,scores)
    thresholds=np.asarray(thresholds,dtype=np.float64)
    if len(labels)!=targets.shape[1] or thresholds.shape!=(len(labels),):raise ValueError('Label/threshold dimension mismatch')
    if not np.isfinite(thresholds).all() or (thresholds<0).any() or (thresholds>1).any():raise ValueError('Invalid thresholds')
    predicted=(scores>=thresholds).astype(np.int8)
    per={};aucs=[];aps=[]
    for index,label in enumerate(labels):
        y=targets[:,index];p=predicted[:,index];s=scores[:,index]
        defined=np.unique(y).size==2
        auc=float(roc_auc_score(y,s)) if defined else None
        ap=float(average_precision_score(y,s)) if defined else None
        if auc is not None:aucs.append(auc)
        if ap is not None:aps.append(ap)
        per[label]={'auroc':auc,'average_precision':ap,'threshold':float(thresholds[index]),
            'precision':float(precision_score(y,p,zero_division=0)),
            'recall':float(recall_score(y,p,zero_division=0)),
            'f1':float(f1_score(y,p,zero_division=0)),
            'positive_images':int(y.sum()),'negative_images':int(len(y)-y.sum()),
            'confusion_matrix':confusion_matrix(y,p,labels=[0,1]).astype(int).tolist(),
            'undefined_reason':None if defined else 'Requires positive and negative examples'}
    flat_both=np.unique(targets).size==2
    return {'images':len(targets),'macro_auroc':float(np.mean(aucs)) if aucs else None,
        'macro_average_precision':float(np.mean(aps)) if aps else None,
        'valid_auroc_findings':len(aucs),'valid_ap_findings':len(aps),
        'micro_auroc':float(roc_auc_score(targets.ravel(),scores.ravel())) if flat_both else None,
        'micro_average_precision':float(average_precision_score(targets.ravel(),scores.ravel())) if flat_both else None,
        'macro_f1':float(f1_score(targets,predicted,average='macro',zero_division=0)),
        'micro_f1':float(f1_score(targets,predicted,average='micro',zero_division=0)),
        'macro_precision':float(precision_score(targets,predicted,average='macro',zero_division=0)),
        'micro_precision':float(precision_score(targets,predicted,average='micro',zero_division=0)),
        'macro_recall':float(recall_score(targets,predicted,average='macro',zero_division=0)),
        'micro_recall':float(recall_score(targets,predicted,average='micro',zero_division=0)),
        'per_finding':per}


@torch.inference_mode()
def predict_loader(model,loader,device,use_amp=True):
    model.eval();all_targets=[];all_scores=[];image_ids=[];loss_sum=0
    criterion=nn.BCEWithLogitsLoss(reduction='sum')
    for images,targets,names in loader:
        images=images.to(device,non_blocking=True,memory_format=torch.channels_last)
        targets=targets.to(device,non_blocking=True)
        with torch.autocast(device_type=device.type,dtype=torch.float16,enabled=use_amp and device.type=='cuda'):
            logits=model(images)
        loss_sum+=float(criterion(logits.float(),targets))
        scores=logits.float().sigmoid()
        if not torch.isfinite(scores).all():raise FloatingPointError('Nonfinite inference scores')
        all_scores.append(scores.cpu().numpy());all_targets.append(targets.cpu().numpy());image_ids.extend(names)
    return np.concatenate(all_targets),np.concatenate(all_scores),image_ids,loss_sum/(len(image_ids)*len(LABELS))


def load_checkpoint(path,device='cpu'):
    checkpoint=torch.load(path,map_location='cpu',weights_only=True)
    if checkpoint['labels']!=LABELS:raise ValueError('Checkpoint label order mismatch')
    model=build_model(checkpoint['architecture'],pretrained=False)
    model.load_state_dict(checkpoint['model_state'],strict=True)
    model=model.to(device).to(memory_format=torch.channels_last).eval()
    return model,checkpoint
