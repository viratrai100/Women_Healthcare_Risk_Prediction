import os
import sys
import pickle
import pandas as pd
import numpy as np

class PredictPipeline:
    def __init__(self):
        self.model_path = os.path.join('model', 'artifacts', 'model.pkl')
        self.preprocessor_path = os.path.join('model', 'artifacts', 'preprocessor.pkl')
        self.label_encoder_path = os.path.join('model', 'artifacts', 'label_encoder.pkl')

    def predict(self, features: pd.DataFrame):
        try:
            with open(self.model_path, 'rb') as f:
                model = pickle.load(f)
            with open(self.preprocessor_path, 'rb') as f:
                preprocessor = pickle.load(f)
            with open(self.label_encoder_path, 'rb') as f:
                label_encoder = pickle.load(f)

            data_scaled = preprocessor.transform(features)
            preds_encoded = model.predict(data_scaled)
            pred_probs = model.predict_proba(data_scaled) if hasattr(model, 'predict_proba') else None
            
            predictions = label_encoder.inverse_transform(preds_encoded)

            results = []
            for i, pred in enumerate(predictions):
                prob_dict = {}
                if pred_probs is not None:
                    for cls_idx, cls_name in enumerate(label_encoder.classes_):
                        prob_dict[cls_name] = round(float(pred_probs[i][cls_idx]), 4)

                results.append({
                    "risk_level": pred,
                    "probabilities": prob_dict
                })
            return results
        except Exception as e:
            raise e

class CustomData:
    def __init__(self, age: float, systolic_bp: float, diastolic_bp: float, bs: float, body_temp: float, heart_rate: float):
        self.age = age
        self.systolic_bp = systolic_bp
        self.diastolic_bp = diastolic_bp
        self.bs = bs
        self.body_temp = body_temp
        self.heart_rate = heart_rate

    def get_data_as_data_frame(self):
        try:
            custom_data_input_dict = {
                "Age": [self.age],
                "SystolicBP": [self.systolic_bp],
                "DiastolicBP": [self.diastolic_bp],
                "BS": [self.bs],
                "BodyTemp": [self.body_temp],
                "HeartRate": [self.heart_rate],
            }
            return pd.DataFrame(custom_data_input_dict)
        except Exception as e:
            raise e
