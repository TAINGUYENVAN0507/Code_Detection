import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

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
    def __init__(self, task_name: str, model_dir: Path, max_length: int = 512):
        self.task_name = task_name
        self.model_dir = Path(model_dir)
        self.max_length = max_length
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.tokenizer = AutoTokenizer.from_pretrained(str(self.model_dir))
        self.model = AutoModelForSequenceClassification.from_pretrained(str(self.model_dir))
        self.model.to(self.device)
        self.model.eval()

        self.id2label = self.load_id2label()

    def load_id2label(self):
        default_labels = DEFAULT_LABELS.get(self.task_name)

        if default_labels:
            return default_labels

        id2label_path = self.model_dir / "id2label.json"

        if id2label_path.exists():
            with open(id2label_path, "r", encoding="utf-8") as f:
                raw = json.load(f)

            return {int(k): str(v) for k, v in raw.items()}

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
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0]

        label_id = int(torch.argmax(probs).item())
        confidence = float(probs[label_id].item())
        prediction_name = self.id2label.get(label_id, f"LABEL_{label_id}")

        probabilities = {
            self.id2label[i]: float(probs[i].item())
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
        backend_root = Path(__file__).resolve().parents[1]
        models_root = backend_root / "models"

        self.model_paths = {
            "subtask_a": models_root / "unixcoder_subtask_a" / "best_model",
            "subtask_b": models_root / "unixcoder_subtask_b" / "best_model",
            "subtask_c": models_root / "unixcoder_subtask_c" / "best_model",
        }

        self.models = {}
        self.load_available_models()

    def is_valid_model_folder(self, path: Path):
        if not path.exists():
            return False

        has_config = (path / "config.json").exists()
        has_tokenizer = (path / "tokenizer.json").exists() or (path / "vocab.json").exists()
        has_model = (path / "model.safetensors").exists() or (path / "pytorch_model.bin").exists()

        return has_config and has_tokenizer and has_model

    def load_available_models(self):
        for task_name, model_path in self.model_paths.items():
            if self.is_valid_model_folder(model_path):
                print(f"Loading {task_name} from {model_path}")
                self.models[task_name] = ModelWrapper(task_name, model_path)
                print(f"Loaded {task_name}")
            else:
                print(f"Skipping {task_name}: {model_path}")

    def get_available_models(self):
        return list(self.models.keys())

    def predict_all(self, code: str):
        if not self.models:
            return {
                "error": "No models are available."
            }

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
                    results[task_name] = {
                        "error": str(e)
                    }

        return results