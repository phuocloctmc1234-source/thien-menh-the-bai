# Công cụ sinh ảnh bằng Meowa

Cần `MEOWART_API_KEY` trong `.env` ở thư mục gốc và `pip install requests pillow`.

- `python gen.py mon1` … chạy từng job lưới 8 ô (xem `JOBS` trong `gen.py`).
- `python sets_gen.py` chạy các job ảnh **món của bộ trang bị** (14 job, mỗi job ~5 credit); truyền tên job
  (ví dụ `set02 set04`) để chạy lại job còn thiếu. Kết quả ở `tools/meowa/out/setNN/`.
- `python build_sets.py` cắt/nén ảnh vào `frontend/img/equip/<mã>.webp` và tự cập nhật danh sách món có ảnh trong `frontend/js/sets.js`.
- `ref.jpg`: ảnh tham chiếu phong cách (Lạc Phong, JPG nền trắng; PNG có alpha sẽ bị từ chối).
