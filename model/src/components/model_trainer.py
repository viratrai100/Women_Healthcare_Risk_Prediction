import os
import sys
import pickle
import json
import numpy as np
from dataclasses import dataclass
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score

@dataclass
class ModelTrainerConfig:
    trained_model_file_path: str = os.path.join('model', 'artifacts', 'model.pkl')
    model_metrics_file_path: str = os.path.join('model', 'artifacts', 'metrics.json')

class ModelTrainer:
    def __init__(self):
        self.model_trainer_config = ModelTrainerConfig()

    def initiate_model_trainer(self, train_array, test_array):
        try:
            X_train, y_train, X_test, y_test = (
                train_array[:, :-1],
                train_array[:, -1],
                test_array[:, :-1],
                test_array[:, -1]
            )

            models = {
                "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42),
                "Gradient Boosting": GradientBoostingClassifier(n_estimators=120, learning_rate=0.1, random_state=42),
                "Decision Tree": DecisionTreeClassifier(max_depth=8, random_state=42)
            }

            model_report = {}
            trained_models = {}

            for model_name, model in models.items():
                model.fit(X_train, y_train)
                y_test_pred = model.predict(X_test)
                acc = accuracy_score(y_test, y_test_pred)
                f1 = f1_score(y_test, y_test_pred, average='weighted')
                model_report[model_name] = acc
                trained_models[model_name] = {
                    "model": model,
                    "accuracy": acc,
                    "f1_score": f1
                }

            best_model_name = max(model_report, key=model_report.get)
            best_model_info = trained_models[best_model_name]
            best_model = best_model_info["model"]

            os.makedirs(os.path.dirname(self.model_trainer_config.trained_model_file_path), exist_ok=True)
            with open(self.model_trainer_config.trained_model_file_path, 'wb') as f:
                pickle.dump(best_model, f)

            metrics = {
                "best_model": best_model_name,
                "accuracy": round(best_model_info["accuracy"] * 100, 2),
                "f1_score": round(best_model_info["f1_score"] * 100, 2),
                "all_models": {k: round(v * 100, 2) for k, v in model_report.items()}
            }

            with open(self.model_trainer_config.model_metrics_file_path, 'w') as f:
                json.dump(metrics, f, indent=2)

            return metrics
        except Exception as e:
            raise e
