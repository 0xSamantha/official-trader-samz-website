# app.py
from flask import Flask, request, jsonify
import base64
from your_model import generate_image

app = Flask(__name__)

@app.route('/run-model', methods=['POST'])
def run_model():
    data = request.get_json()
    image_data = data['image'].split(',')[1]
    image_bytes = base64.b64decode(image_data)
    
    # run model here - NEED TO INSERT STILL
    result = generate_image(image_bytes)
    
    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(port=5000)
