from flask import Flask, request, jsonify, render_template
import mysql.connector
from flask_cors import CORS
import datetime
import threading
import time
import pygame
import tkinter as tk
from tkinter import Label
import os
import psycopg2

app = Flask(__name__, static_folder="static")
CORS(app)

# Lưu ghi chú đã nhắc nhở
notified_notes = set()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", "usbw"),
        port=os.getenv("DB_PORT", "3307"),
        database=os.getenv("DB_NAME", "luu_tru_ghi_chu")
    )

@app.route("/")
def home():
    return render_template("index.html")

@app.route('/delete_note', methods=['POST'])
def delete_note():
    data = request.get_json()
    title = data.get("title")

    if not title:
        return jsonify({"error": "Không có tiêu đề!"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "DELETE FROM bang_ghi_chu WHERE Title = %s"
        cursor.execute(sql, (title,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Ghi chú đã được xóa!"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": "Lỗi xóa ghi chú!", "details": str(err)}), 500

@app.route('/save_note', methods=['POST'])
def save_note():
    if not request.is_json:
        return jsonify({"error": "Dữ liệu không hợp lệ!"}), 415  
    data = request.get_json()
    
    tit = data['_title']
    bod = data['_body']
    datim = data['date_time']

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "INSERT INTO bang_ghi_chu (Title, Body, Remind_Time) VALUES (%s, %s, %s)"
        cursor.execute(sql, (tit, bod, datim))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Ghi chú đã được lưu!"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": "Không thể lưu ghi chú!", "details": str(err)}), 500

# Hàm hiển thị popup với âm thanh trên luồng riêng
def show_popup(title, content):
    def popup_thread():
        root = tk.Tk()
        root.withdraw()

        pygame.mixer.init()
        
        popup = tk.Toplevel(root)
        popup.title("🔔 Nhắc nhở!")
        popup.geometry("400x200+500+250")
        popup.configure(bg="white")

        text_label = Label(popup, text=f"{title}\n\n{content}", font=("Arial", 14), bg="white", wraplength=350)
        text_label.pack(padx=20, pady=20)

        def close_popup():
            popup.destroy()
            pygame.mixer.music.stop()
            root.quit()

        button = tk.Button(popup, text="Đóng", command=close_popup, font=("Arial", 12))
        button.pack(pady=10)

        pygame.mixer.music.load("notification-19-270138.mp3")
        pygame.mixer.music.play(-1)

        root.mainloop()

    threading.Thread(target=popup_thread, daemon=True).start()

# Hàm kiểm tra và nhắc nhở ghi chú
reminder_running = False  # Thêm biến kiểm soát
def remind():
    global notified_notes, reminder_running
    if reminder_running:  # Kiểm tra nếu luồng đã chạy
        return  
    reminder_running = True  # Đánh dấu là đang chạy
    while True:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            now = datetime.datetime.now().strftime('%m-%d %H:%M')
            query = "SELECT Title, Body FROM bang_ghi_chu WHERE DATE_FORMAT(Remind_Time, '%m-%d %H:%i') = %s"
            cursor.execute(query, (now,))
            notes = cursor.fetchall()

            for title, content in notes:
                note_key = f"{title}-{now}"  # Ghi chú với thời gian chính xác đến phút
                if note_key not in notified_notes:
                    notified_notes.add(note_key)  # Đánh dấu trước khi gọi popup
                    print(f"🔔 Nhắc nhở: {title} - {content}")  
                    show_popup(title, content)

            cursor.close()
            conn.close()
        except mysql.connector.Error as err:
            print("Lỗi MySQL:", err)

        time.sleep(1)  # Kiểm tra lại sau mỗi 1 giây

if __name__ == '__main__':
    if not reminder_running:
        reminder_thread = threading.Thread(target=remind, daemon=True)
        reminder_thread.start()

    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)

