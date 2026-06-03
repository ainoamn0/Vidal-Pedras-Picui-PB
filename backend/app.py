from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
from models import db, Product
import os
import json

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
STATIC_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)

db.init_app(app)

with app.app_context():
    db.create_all()

def save_products_js():
    try:
        products = Product.query.all()
        result = []
        for p in products:
            images_list = []
            if p.images:
                try:
                    images_list = json.loads(p.images)
                    if not isinstance(images_list, list):
                        images_list = [images_list]
                except Exception:
                    images_list = p.images.split('|')
            result.append({
                'id': p.id,
                'name': p.name,
                'type': p.type,
                'category': p.category,
                'price': p.price,
                'description': p.description,
                'benefits': p.benefits,
                'images': images_list
            })
        js_content = f"const products = {json.dumps(result, indent=4, ensure_ascii=False)};\n"
        products_js_path = os.path.join(STATIC_DIR, 'products.js')
        with open(products_js_path, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print("Updated products.js successfully.")
    except Exception as e:
        print(f"Error saving products.js: {e}")

with app.app_context():
    save_products_js()

# API Endpoints
@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    result = []
    for p in products:
        images_list = []
        if p.images:
            try:
                images_list = json.loads(p.images)
                if not isinstance(images_list, list):
                    images_list = [images_list]
            except Exception:
                images_list = p.images.split('|')
        result.append({
            'id': p.id,
            'name': p.name,
            'type': p.type,
            'category': p.category,
            'price': p.price,
            'description': p.description,
            'benefits': p.benefits,
            'images': images_list
        })
    return jsonify(result)

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json
    if not data:
        abort(400, 'No data supplied')
    images = json.dumps(data.get('images', []))
    prod = Product(
        name=data.get('name'),
        type=data.get('type'),
        category=data.get('category'),
        price=data.get('price'),
        description=data.get('description'),
        benefits=data.get('benefits'),
        images=images
    )
    db.session.add(prod)
    db.session.commit()
    save_products_js()
    return jsonify({'msg': 'Product added', 'id': prod.id}), 201

@app.route('/api/products/<int:pid>', methods=['PUT'])
def update_product(pid):
    prod = Product.query.get_or_404(pid)
    data = request.json
    if not data:
        abort(400, 'No data supplied')
    prod.name = data.get('name', prod.name)
    prod.type = data.get('type', prod.type)
    prod.category = data.get('category', prod.category)
    prod.price = data.get('price', prod.price)
    prod.description = data.get('description', prod.description)
    prod.benefits = data.get('benefits', prod.benefits)
    images = data.get('images')
    if images is not None:
        prod.images = json.dumps(images)
    db.session.commit()
    save_products_js()
    return jsonify({'msg': 'Product updated'})

@app.route('/api/products/<int:pid>', methods=['DELETE'])
def delete_product(pid):
    prod = Product.query.get_or_404(pid)
    db.session.delete(prod)
    db.session.commit()
    save_products_js()
    return jsonify({'msg': 'Product deleted'}), 204

# Serve static files (frontend)
@app.route('/')
def serve_index():
    return send_from_directory(STATIC_DIR, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(STATIC_DIR, path)

if __name__ == '__main__':
    app.run(debug=True)
