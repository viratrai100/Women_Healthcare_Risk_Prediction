import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

def train_and_export():
    dataset_path = os.path.join('model', 'notebook', 'data', 'dataset.csv')
    df = pd.read_csv(dataset_path)
    print("Dataset shape:", df.shape)
    print("Columns:", df.columns.tolist())
    print("Target distribution:\n", df['RiskLevel'].value_counts())

    X = df[['Age', 'SystolicBP', 'DiastolicBP', 'BS', 'BodyTemp', 'HeartRate']]
    y = df['RiskLevel']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    rf = RandomForestClassifier(n_estimators=100, max_depth=12, min_samples_split=4, random_state=42)
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"\nModel Accuracy: {acc*100:.2f}%")
    print("Feature Importances:")
    for col, imp in zip(X.columns, rf.feature_importances_):
        print(f"  {col:15s}: {imp*100:.2f}%")

    os.makedirs(os.path.join('model', 'artifacts'), exist_ok=True)
    summary = {
        "model": "RandomForestClassifier",
        "accuracy": round(acc * 100, 2),
        "features": X.columns.tolist(),
        "feature_importances": {col: round(float(imp), 4) for col, imp in zip(X.columns, rf.feature_importances_)},
        "classes": rf.classes_.tolist(),
        "report": report
    }

    with open(os.path.join('model', 'artifacts', 'model_summary.json'), 'w') as f:
        json.dump(summary, f, indent=2)

    print("\nSaved model summary to model/artifacts/model_summary.json")

if __name__ == '__main__':
    train_and_export()
