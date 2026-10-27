import io
from PIL import Image
from fastapi.testclient import TestClient
from app import app

class FakePredictor:
    def predict(self, data):
        if data == b'bad': raise ValueError('Invalid image')
        return {'architecture':'resnet50','model_version':'test','findings':[{'finding':'Effusion','score':0.9,'threshold':0.5,'above_threshold':True}], 'no_label_above_threshold':False, 'scores_are_calibrated_probabilities':False}
    def explain(self,data,finding):
        import numpy as np
        return {'finding':finding,'architecture':'resnet50','score':0.9,'degenerate':False,'heatmap':np.ones((224,224), dtype=np.float32)}

def test_prediction_and_explanation_contract():
    app.state.predictor_factory=lambda model:FakePredictor()
    image=io.BytesIO();Image.new('RGB',(40,40),'white').save(image,'PNG')
    with TestClient(app) as client:
        response=client.post('/predict',files={'file':('x.png',image.getvalue(),'image/png')},data={'model':'resnet50','explain_finding':'Effusion'})
        assert response.status_code==200, response.text
        data=response.json();assert data['findings'][0]['finding']=='Effusion'
        assert data['explanation']['overlay_data_url'].startswith('data:image/png;base64,')
        assert data['explanation']['degenerate'] is False

def test_invalid_image_and_unknown_model_are_rejected():
    app.state.predictor_factory=lambda model:FakePredictor()
    with TestClient(app) as client:
        assert client.post('/predict',files={'file':('x.png',b'bad','image/png')}).status_code==400
        assert client.post('/predict',files={'file':('x.png',b'bad','image/png')},data={'model':'unknown'}).status_code==422
        assert client.post('/predict',files={'file':('x.png',b'bad','image/png')},data={'explain_finding':'unknown'}).status_code==422

def test_models_are_loaded_before_service_reports_ready():
    app.state.predictor_factory=lambda model:FakePredictor()
    with TestClient(app) as client:
        health=client.get('/health').json()
        assert health['status']=='ok'
        assert health['loaded_models']==['resnet50','densenet121']
