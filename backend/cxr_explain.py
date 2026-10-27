"""Class-specific Grad-CAM. A heatmap visualizes model influence, not diagnosis."""
import numpy as np
import torch
import torch.nn.functional as F


def gradcam(model,target_layer,input_batch,class_index):
    if input_batch.ndim!=4 or input_batch.shape[0]!=1:
        raise ValueError('Grad-CAM requires a single[N=1,C,H,W] input')
    activations=[]
    def capture(_module,_inputs,output):activations.append(output)
    handle=target_layer.register_forward_hook(capture)
    try:
        model.eval()
        with torch.enable_grad():
            inputs=input_batch.detach().float().requires_grad_(True)
            logits=model(inputs)
            if not isinstance(class_index,int) or not 0<=class_index<logits.shape[1]:
                raise ValueError('Selected finding index is outside the model outputs')
            if len(activations)!=1 or activations[0].ndim!=4:
                raise ValueError('Target layer must produce one spatial feature tensor')
            activation=activations[0]
            gradients=torch.autograd.grad(logits[0,class_index],activation,retain_graph=False)[0]
            weights=gradients.mean(dim=(2,3),keepdim=True)
            raw=(weights*activation).sum(dim=1,keepdim=True).relu()
            heatmap=F.interpolate(raw,size=inputs.shape[-2:],mode='bilinear',align_corners=False)[0,0].detach()
            if not torch.isfinite(heatmap).all():raise FloatingPointError('Nonfinite Grad-CAM heatmap')
            low=float(heatmap.min());high=float(heatmap.max())
            degenerate=high-low<=1e-12
            normalized=torch.zeros_like(heatmap) if degenerate else (heatmap-low)/(high-low)
            return {'heatmap':normalized.detach().cpu().numpy().astype(np.float32),
                'degenerate':degenerate,'class_index':class_index,
                'score':float(logits[0,class_index].detach().sigmoid()),
                'method':'Grad-CAM','native_feature_size':list(activation.shape[-2:]),
                'limitation':'Model-influence visualization; not a clinically validated explanation'}
    finally:
        handle.remove()


def target_layer(model,architecture):
    if architecture=='resnet50':return model.layer4[-1]
    if architecture=='densenet121':return model.features.norm5
    raise ValueError(f'Unsupported Grad-CAM architecture:{architecture}')
