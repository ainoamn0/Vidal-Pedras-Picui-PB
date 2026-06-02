from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'pedra' or 'acessorio'
    price = db.Column(db.String(20))
    category = db.Column(db.String(80))
    description = db.Column(db.Text)
    benefits = db.Column(db.Text)
    images = db.Column(db.Text)  # URLs separated by commas
