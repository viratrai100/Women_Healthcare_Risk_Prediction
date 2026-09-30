import os
import sys
import pickle
import numpy as np
import pandas as pd
from dataclasses import dataclass
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

@dataclass
class DataTransformationConfig:
    preprocessor_obj_file_path: str = os.path.join('model', 'artifacts', 'preprocessor.pkl')
    label_encoder_file_path: str = os.path.join('model', 'artifacts', 'label_encoder.pkl')

class DataTransformation:
    def __init__(self):
        self.transformation_config = DataTransformationConfig()

    def get_data_transformer_object(self):
        try:
            numerical_columns = ['Age', 'SystolicBP', 'DiastolicBP', 'BS', 'BodyTemp', 'HeartRate']
            num_pipeline = Pipeline(
                steps=[
                    ('scaler', StandardScaler())
                ]
            )
            preprocessor = ColumnTransformer(
                [
                    ('num_pipeline', num_pipeline, numerical_columns)
                ]
            )
            return preprocessor
        except Exception as e:
            raise e

    def initiate_data_transformation(self, train_path: str, test_path: str):
        try:
            train_df = pd.read_csv(train_path)
            test_df = pd.read_csv(test_path)

            preprocessing_obj = self.get_data_transformer_object()
            target_column_name = 'RiskLevel'
            numerical_columns = ['Age', 'SystolicBP', 'DiastolicBP', 'BS', 'BodyTemp', 'HeartRate']

            # Label encoding for RiskLevel
            le = LabelEncoder()
            train_target = le.fit_transform(train_df[target_column_name])
            test_target = le.transform(test_df[target_column_name])

            input_feature_train_df = train_df[numerical_columns]
            input_feature_test_df = test_df[numerical_columns]

            input_feature_train_arr = preprocessing_obj.fit_transform(input_feature_train_df)
            input_feature_test_arr = preprocessing_obj.transform(input_feature_test_df)

            train_arr = np.c_[input_feature_train_arr, np.array(train_target)]
            test_arr = np.c_[input_feature_test_arr, np.array(test_target)]

            os.makedirs(os.path.dirname(self.transformation_config.preprocessor_obj_file_path), exist_ok=True)
            with open(self.transformation_config.preprocessor_obj_file_path, 'wb') as f:
                pickle.dump(preprocessing_obj, f)
            with open(self.transformation_config.label_encoder_file_path, 'wb') as f:
                pickle.dump(le, f)

            return (
                train_arr,
                test_arr,
                self.transformation_config.preprocessor_obj_file_path,
                self.transformation_config.label_encoder_file_path
            )
        except Exception as e:
            raise e
