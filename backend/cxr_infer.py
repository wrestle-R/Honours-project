"""Inference API/CLI for the exported, tested academic checkpoints."""
import argparse
import io
import json
from pathlib import Path

import numpy as np
import torch
from PIL import Image

from cxr_explain import gradcam,target_layer
from cxr_model import IMAGE_SIZE,LABELS,MEAN,STD,input_tensor,load_checkpoint


class ChestXrayPredictor:
    def __init__(self,checkpoint_path,device='auto'):
        self.device=torch.device('cuda' if device=='auto' and torch.cuda.is_available() else 'cpu' if device=='auto' else device)
        self.model,self.checkpoint=load_checkpoint(checkpoint_path,self.device)
        if self.checkpoint.get('artifact_type')!='tested_academic_model':
            raise ValueError('Use an exported final checkpoint with completed held-out evaluation')
        config=self.checkpoint.get('config',{})
        if config.get('image_size')!=IMAGE_SIZE or config.get('normalization_mean')!=MEAN or config.get('normalization_std')!=STD:
            raise ValueError('Checkpoint preprocessing differs from this inference implementation')
        self.thresholds=np.asarray(self.checkpoint.get('decision_thresholds',[]),dtype=np.float64)
        if self.thresholds.shape!=(len(LABELS),) or not np.isfinite(self.thresholds).all() or (self.thresholds<0).any() or (self.thresholds>1).any():
            raise ValueError('Checkpoint is missing valid per-finding thresholds')
        self.architecture=self.checkpoint['architecture']

    def _input(self,payload):
        return input_tensor(payload).unsqueeze(0).to(self.device,memory_format=torch.channels_last)

    def predict(self,payload):
        inputs=self._input(payload)
        with torch.inference_mode(),torch.autocast(device_type=self.device.type,dtype=torch.float16,enabled=self.device.type=='cuda'):
            logits=self.model(inputs)
        scores=logits.float().sigmoid()[0].cpu().numpy()
        if not np.isfinite(scores).all():raise FloatingPointError('Model returned invalid scores')
        findings=[{'finding':label,'score':float(scores[index]),'threshold':float(self.thresholds[index]),
            'above_threshold':bool(scores[index]>=self.thresholds[index])} for index,label in enumerate(LABELS)]
        return {'architecture':self.architecture,'model_version':self.checkpoint.get('model_version','unspecified'),'findings':findings,
            'no_label_above_threshold':not any(row['above_threshold'] for row in findings),
            'scores_are_calibrated_probabilities':False,'threshold_source':'validation maximum F1 per finding',
            'input_validation':'PNG/JPEG format and dimensions only; no chest-X-ray or out-of-distribution detector',
            'interpretation':'No label above threshold does not establish a clinically normal scan.',
            'disclaimer':'Academic research prototype; not a diagnostic product or substitute for professional medical advice.'}

    def explain(self,payload,finding):
        if finding not in LABELS:raise ValueError(f'Unknown finding:{finding}')
        result=gradcam(self.model,target_layer(self.model,self.architecture),self._input(payload),LABELS.index(finding))
        result.update(finding=finding,architecture=self.architecture)
        return result


def save_overlay(payload,heatmap,path,opacity=.55):
    if not 0<=opacity<=1:raise ValueError('Opacity must be between0 and1')
    from matplotlib import colormaps
    with Image.open(io.BytesIO(payload)) as source:
        image=source.convert('L').resize((IMAGE_SIZE,IMAGE_SIZE),Image.Resampling.LANCZOS,reducing_gap=3.0).convert('RGB')
    base=np.asarray(image).astype(np.float32)/255
    colors=colormaps['jet'](heatmap)[...,:3]
    alpha=(heatmap*opacity)[...,None]
    overlay=np.clip((1-alpha)*base+alpha*colors,0,1)
    Image.fromarray(np.round(overlay*255).astype(np.uint8)).save(path)


if __name__=='__main__':
    p=argparse.ArgumentParser(description='Academic chest X-ray findings model; not diagnosis')
    p.add_argument('checkpoint');p.add_argument('--image',required=True);p.add_argument('--device',default='auto')
    p.add_argument('--finding',choices=LABELS);p.add_argument('--overlay');p.add_argument('--opacity',type=float,default=.55)
    args=p.parse_args()
    predictor=ChestXrayPredictor(args.checkpoint,args.device)
    payload=Path(args.image).read_bytes()
    result=predictor.predict(payload)
    if args.finding:
        explanation=predictor.explain(payload,args.finding)
        heatmap=explanation.pop('heatmap')
        if args.overlay:
            save_overlay(payload,heatmap,args.overlay,args.opacity)
            np.save(str(Path(args.overlay).with_suffix('.npy')),heatmap)
            explanation['overlay_file']=args.overlay
        result['explanation']=explanation
    print(json.dumps(result,indent=2))
