import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

DEFAULT_LABELS = {
    "subtask_a": {
        0: "Human",
        1: "AI",
    },
    "subtask_b": {
        0: "Human",
        1: "DeepSeek-AI",
        2: "Qwen",
        3: "01-ai",
        4: "BigCode",
        5: "Gemma",
        6: "Phi",
        7: "Meta-LLaMA",
        8: "IBM-Granite",
        9: "Mistral",
        10: "OpenAI",
    },
    "subtask_c": {
        0: "Human",
        1: "Machine",
        2: "Hybrid",
        3: "Adversarial",
    },
}


class ModelWrapper:
    def __init__(self, task_name: str, model_id: str, max_length: int = 512):
        self.task_name = task_name
        self.model_id = model_id
        self.max_length = max_length
        self.token = os.getenv("HF_TOKEN")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id,
            token=self.token,
        )
        self.model = AutoModelForSequenceClassification.from_pretrained(
            self.model_id,
            token=self.token,
        )
        self.model.to(self.device)
        self.model.eval()

        self.id2label = self.load_id2label()

    def load_id2label(self):
        default_labels = DEFAULT_LABELS.get(self.task_name)

        if default_labels:
            return default_labels

        config_id2label = getattr(self.model.config, "id2label", None)

        if config_id2label:
            return {int(k): str(v) for k, v in config_id2label.items()}

        return {i: f"LABEL_{i}" for i in range(self.model.config.num_labels)}

    def predict(self, code: str):
        inputs = self.tokenizer(
            code,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )
        inputs = {key: value.to(self.device) for key, value in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0]

        label_id = int(torch.argmax(probs).item())
        confidence = float(probs[label_id].item())
        prediction_name = self.id2label.get(label_id, f"LABEL_{label_id}")

        probabilities = {
            self.id2label.get(i, f"LABEL_{i}"): float(probs[i].item())
            for i in range(len(probs))
        }

        return {
            "label": label_id,
            "prediction": prediction_name,
            "confidence": confidence,
            "summary": f"{prediction_name} - {confidence * 100:.2f}%",
            "probabilities": probabilities,
        }


class ModelService:
    def __init__(self):
        self.model_repos = {
            "subtask_a": os.getenv(
                "SUBTASK_A_MODEL_ID",
                "tainguyenvan0507/unixcoder_subtask_a",
            ),
            "subtask_b": os.getenv(
                "SUBTASK_B_MODEL_ID",
                "tainguyenvan0507/unixcoder_subtask_b",
            ),
            "subtask_c": os.getenv(
                "SUBTASK_C_MODEL_ID",
                "tainguyenvan0507/unixcoder_subtask_c",
            ),
        }
        self.models = {}
        self.load_available_models()

    def load_available_models(self):
        for task_name, model_id in self.model_repos.items():
            try:
                print(f"Loading {task_name} from {model_id}")
                self.models[task_name] = ModelWrapper(task_name, model_id)
                print(f"Loaded {task_name}")
            except Exception as e:
                print(f"Skipping {task_name}: {e}")

    def get_available_models(self):
        return list(self.models.keys())

    def predict_all(self, code: str):
        if not self.models:
            return {"error": "No models are available."}

        results = {}

        with ThreadPoolExecutor(max_workers=len(self.models)) as executor:
            futures = {
                task_name: executor.submit(model.predict, code)
                for task_name, model in self.models.items()
            }

            for task_name, future in futures.items():
                try:
                    results[task_name] = future.result()
                except Exception as e:
                    results[task_name] = {"error": str(e)}

        return results