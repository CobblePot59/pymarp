from flask import Flask, render_template, request, send_file
from werkzeug.utils import secure_filename
from pptx2md import convert, ConversionConfig
from pathlib import Path
import os
import tempfile
import logging
import zipfile
import io

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', tempfile.gettempdir())
ALLOWED_EXTENSIONS = {'pptx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert')
def convert_page():
    return render_template('convert.html')

@app.route('/edit')
def edit_page():
    return render_template('edit.html')

@app.route('/preview')
def preview_page():
    return render_template('preview.html')

@app.route('/api/convert', methods=['POST'])
def convert_route():
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400
    
    file = request.files['file']
    
    if file.filename == '':
        return {'error': 'No file selected'}, 400
    
    if not allowed_file(file.filename):
        return {'error': 'Only PPTX files are accepted'}, 400
    
    try:
        # Create a temporary folder for this conversion
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            
            # Save the PPTX file
            filename = secure_filename(file.filename)
            pptx_path = temp_dir_path / filename
            file.save(str(pptx_path))
            
            # Output path for markdown
            output_filename = os.path.splitext(filename)[0] + '.md'
            output_path = temp_dir_path / output_filename
            
            # Folder for extracted images
            image_dir = temp_dir_path / 'images'
            
            # Convert PPTX to Markdown
            convert(
                ConversionConfig(
                    pptx_path=pptx_path,
                    output_path=output_path,
                    image_dir=image_dir,
                    disable_notes=False
                )
            )
            
            # Create a ZIP with markdown and images
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add the markdown file
                with open(output_path, 'r', encoding='utf-8') as f:
                    zip_file.writestr(output_filename, f.read())
                
                # Add images if any exist
                if image_dir.exists():
                    for img_file in image_dir.iterdir():
                        if img_file.is_file():
                            zip_file.write(img_file, arcname=f'images/{img_file.name}')
            
            zip_buffer.seek(0)
            
            # Create the ZIP filename
            zip_filename = os.path.splitext(filename)[0] + '.zip'
            
            logger.info(f'Conversion successful: {filename} -> {zip_filename}')
            
            return send_file(
                zip_buffer,
                mimetype='application/zip',
                as_attachment=True,
                download_name=zip_filename
            )
    
    except Exception as e:
        logger.error(f'Conversion error: {str(e)}')
        return {'error': f'Error during conversion: {str(e)}'}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
