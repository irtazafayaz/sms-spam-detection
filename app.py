from flask import Flask, render_template, request, jsonify, Response
import os
import pickle
import io
import csv
import pandas as pd

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, 'notebooks', 'model.pkl')
VECT_PATH = os.path.join(BASE_DIR, 'notebooks', 'vectorizer.pkl')

app = Flask(__name__, static_folder='static', template_folder='templates')

model = None
vectorizer = None
model_loaded = False
predictions_history = []
HISTORY_MAX = 100


def load_model():
    global model, vectorizer, model_loaded
    try:
        with open(VECT_PATH, 'rb') as vf:
            vectorizer = pickle.load(vf)
        with open(MODEL_PATH, 'rb') as mf:
            model = pickle.load(mf)
        model_loaded = True
        print('Model and vectorizer loaded successfully')
    except Exception as exc:
        print('Error loading model or vectorizer:', exc)
        model_loaded = False


def _get_spam_probability(probs):
    try:
        classes = list(getattr(model, 'classes_', []))
        spam_idx = None
        for candidate in (1, '1', 'spam', 'SPAM', True):
            if candidate in classes:
                spam_idx = classes.index(candidate)
                break
        if spam_idx is None and len(classes) == 2:
            spam_idx = 1
        if spam_idx is not None:
            return float(probs[spam_idx])
    except Exception:
        pass
    return float(max(probs))


load_model()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json() or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    if not model_loaded:
        return jsonify({'error': 'Model not loaded on server'}), 500
    try:
        X = vectorizer.transform([text])
        prob = None
        if hasattr(model, 'predict_proba'):
            probs = model.predict_proba(X)[0]
            prob = _get_spam_probability(probs)
        else:
            pred = model.predict(X)[0]
            prob = 1.0 if str(pred) in ['1', 'spam',
                                        'SPAM', 'True', 'true'] else 0.0
        label = 'spam' if prob >= 0.5 else 'ham'
        entry = {'text': text, 'prediction': label, 'probability': prob}
        predictions_history.insert(0, entry)
        if len(predictions_history) > HISTORY_MAX:
            predictions_history.pop()
        return jsonify(entry)
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@app.route('/history', methods=['GET'])
def history():
    return jsonify(predictions_history)


@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    if not model_loaded:
        return jsonify({'error': 'Model not loaded on server'}), 500
    try:
        if 'file' in request.files:
            f = request.files['file']
            df = pd.read_csv(f)
            if 'text' not in df.columns:
                df.columns = [c.strip() for c in df.columns]
                df.rename(columns={df.columns[0]: 'text'}, inplace=True)
            texts = df['text'].astype(str).tolist()
        else:
            js = request.get_json() or {}
            texts = js.get('texts') or []
        results = []
        X = vectorizer.transform(texts)
        probs = None
        if hasattr(model, 'predict_proba'):
            probs = model.predict_proba(X)
        preds = model.predict(X)
        for i, t in enumerate(texts):
            p = 0.0
            if probs is not None:
                p = _get_spam_probability(probs[i])
            else:
                p = 1.0 if str(preds[i]) in ['1', 'spam',
                                             'SPAM', 'True', 'true'] else 0.0
            label = 'spam' if p >= 0.5 else 'ham'
            results.append({'text': t, 'prediction': label, 'probability': p})
        output = io.StringIO()
        writer = csv.DictWriter(
            output, fieldnames=['text', 'prediction', 'probability'])
        writer.writeheader()
        for r in results:
            writer.writerow(r)
        output.seek(0)
        return Response(output.getvalue(), mimetype='text/csv', headers={
            'Content-Disposition': 'attachment; filename=predictions.csv'
        })
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
