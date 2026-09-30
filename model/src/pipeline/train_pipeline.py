import os
import sys
from model.src.components.data_ingestion import DataIngestion
from model.src.components.data_transformation import DataTransformation
from model.src.components.model_trainer import ModelTrainer

class TrainPipeline:
    def __init__(self):
        pass

    def run_pipeline(self):
        print("[Pipeline] Starting data ingestion...")
        ingestion = DataIngestion()
        train_path, test_path = ingestion.initiate_data_ingestion()

        print("[Pipeline] Starting data transformation...")
        transformation = DataTransformation()
        train_arr, test_arr, _, _ = transformation.initiate_data_transformation(train_path, test_path)

        print("[Pipeline] Training and evaluating models...")
        trainer = ModelTrainer()
        metrics = trainer.initiate_model_trainer(train_arr, test_arr)

        print(f"[Pipeline] Training completed! Best model: {metrics['best_model']} (Accuracy: {metrics['accuracy']}%)")
        return metrics

if __name__ == '__main__':
    pipeline = TrainPipeline()
    metrics = pipeline.run_pipeline()
    print("Metrics:", metrics)
