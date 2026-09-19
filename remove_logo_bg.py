import base64
import os
from PIL import Image

def remove_white_bg_and_enhance(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")

    # High quality Lanczos resize if source image is small, to ensure crisp high-DPI rendering
    if img.width < 500:
        new_w = img.width * 2
        new_h = img.height * 2
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    datas = img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata()
    
    newData = []
    for item in datas:
        # Detect white / near-white background pixels (R > 215, G > 215, B > 215)
        if item[0] > 215 and item[1] > 215 and item[2] > 215:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Auto-crop empty transparent padding surrounding the logo
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG", optimize=True)
    print(f"Saved high-clarity transparent logo to {output_path} (Size: {img.size})")

new_logo_file = r"C:\Users\Asus\.gemini\antigravity-ide\brain\be302025-65c4-418e-abf4-aac6b95b7ae9\.user_uploaded\media_1789832188871.jpg"

public_logo = r"c:\Users\Asus\OneDrive\Desktop\fdplacement analyzer project\placement\public\adithya_logo.png"
src_logo = r"c:\Users\Asus\OneDrive\Desktop\fdplacement analyzer project\placement\src\assets\images\adithya_logo.png"

remove_white_bg_and_enhance(new_logo_file, public_logo)
remove_white_bg_and_enhance(new_logo_file, src_logo)

# Convert transparent logo to Base64 data URI
with open(public_logo, "rb") as f:
    encoded = base64.b64encode(f.read()).decode("utf-8")
    data_url = f"data:image/png;base64,{encoded}"

base64_ts_path = r"c:\Users\Asus\OneDrive\Desktop\fdplacement analyzer project\placement\src\assets\images\adithyaLogoBase64.ts"
with open(base64_ts_path, "w", encoding="utf-8") as f:
    f.write(f'export const ADITHYA_LOGO_BASE64 = "{data_url}";\n')

print("Updated adithyaLogoBase64.ts with enhanced clarity transparent logo Base64!")
