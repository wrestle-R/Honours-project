"""Chest X-ray demo API. Academic prototype, not a diagnostic service."""
import base64, io, os, threading, logging
from contextlib import asynccontextmanager
from enum import Enum
from pathlib import Path
from typing import Optional
import numpy as np
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

LABELS=['Atelectasis','Cardiomegaly','Consolidation','Edema','Effusion','Emphysema','Fibrosis','Hernia','Infiltration','Mass','Nodule','Pleural_Thickening','Pneumonia','Pneumothorax']
Finding=Enum('Finding',{x:x for x in LABELS},type=str)
class ModelName(str,Enum):
    resnet50='resnet50'
    densenet121='densenet121'
MAX_BYTES=20*1024*1024
ROOT=Path(__file__).resolve().parent
MODEL_DIR=Path(os.environ.get('MODEL_DIR',str(ROOT/'models')))
MODEL_FILES={'resnet50':'ResNet50_final.pt','densenet121':'DenseNet121_final.pt'}
origins=os.environ.get('CORS_ORIGINS','http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173')
@asynccontextmanager
async def lifespan(app):
    app.state.loaded_models=[]
    for model in MODEL_FILES:
        await run_in_threadpool(app.state.predictor_factory, model)
        app.state.loaded_models.append(model)
    yield

app=FastAPI(title='Chest X-ray Demo API',version='1.0.0',description='Academic prototype, not for diagnosis',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in origins.split(',') if x.strip()],allow_methods=['GET','POST'],allow_headers=['*'])
_cache={};_lock=threading.Lock()
def get_predictor(model):
    if model not in _cache:
        path=MODEL_DIR/MODEL_FILES[model]
        if not path.is_file():raise FileNotFoundError('Model checkpoint is unavailable')
        from cxr_infer import ChestXrayPredictor
        _cache[model]=ChestXrayPredictor(path,device=os.environ.get('MODEL_DEVICE','auto'))
    return _cache[model]
app.state.predictor_factory=get_predictor

@app.get('/health')
def health():
    return {'status':'ok','service':'chest-xray-demo','loaded_models':app.state.loaded_models,'model_files':{name:(MODEL_DIR/filename).is_file() for name,filename in MODEL_FILES.items()}}

@app.get('/models')
def models():
    return {'default_model':'resnet50','models':[{'id':name,'available':(MODEL_DIR/path).is_file()} for name,path in MODEL_FILES.items()],'findings':LABELS,'disclaimer':'Academic prototype; not for diagnosis.'}

def overlay_data_url(payload,heatmap):
    heat=np.asarray(heatmap,dtype=np.float32)
    if heat.shape!=(224,224) or not np.isfinite(heat).all():raise ValueError('Invalid explanation map')
    heat=np.clip(heat,0,1)
    with Image.open(io.BytesIO(payload)) as source:
        source=source.convert('L').resize((224,224),Image.Resampling.LANCZOS,reducing_gap=3.0).convert('RGB')
        base=np.asarray(source,dtype=np.float32)/255
    color=np.stack([np.clip(1.5-np.abs(4*heat-3),0,1),np.clip(1.5-np.abs(4*heat-2),0,1),np.clip(1.5-np.abs(4*heat-1),0,1)],axis=-1)
    alpha=(heat*.55)[...,None]
    image=Image.fromarray(np.round(np.clip(base*(1-alpha)+color*alpha,0,1)*255).astype('uint8'))
    output=io.BytesIO();image.save(output,format='PNG')
    return 'data:image/png;base64,'+base64.b64encode(output.getvalue()).decode('ascii')

def infer(payload,model,finding):
    with _lock:
        predictor=app.state.predictor_factory(model)
        result=predictor.predict(payload)
        if finding:
            explanation=predictor.explain(payload,finding)
            heatmap=explanation.pop('heatmap')
            explanation['overlay_data_url']=overlay_data_url(payload,heatmap)
            result['explanation']=explanation
        return result

@app.post('/predict')
async def predict(file:UploadFile=File(...),model:ModelName=Form(ModelName.resnet50),explain_finding:Optional[Finding]=Form(None)):
    data=await file.read(MAX_BYTES+1);await file.close()
    if not data:raise HTTPException(status_code=400,detail='Image file is empty')
    if len(data)>MAX_BYTES:raise HTTPException(status_code=413,detail='Image exceeds 20 MiB limit')
    try:
        with Image.open(io.BytesIO(data)) as image:
            if image.format not in ('PNG','JPEG'):raise ValueError('Unsupported format')
            if min(image.size)<32 or max(image.size)>8192 or image.width*image.height>32_000_000:raise ValueError('Unsupported dimensions')
            image.verify()
    except (ValueError,UnidentifiedImageError,OSError,Image.DecompressionBombError) as exc:
        raise HTTPException(status_code=400,detail='Invalid or unsupported PNG/JPEG image') from exc
    try:return await run_in_threadpool(infer,data,model.value,explain_finding.value if explain_finding else None)
    except FileNotFoundError as exc:raise HTTPException(status_code=503,detail='Requested model checkpoint is unavailable') from exc
    except ValueError as exc:raise HTTPException(status_code=400,detail=str(exc)) from exc
    except Exception as exc:
        logging.exception('Inference failed')
        raise HTTPException(status_code=500,detail='Model inference failed; check server logs') from exc
