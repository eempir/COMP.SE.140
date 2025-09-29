from flask import Flask
import time, shutil, requests
import os

app = Flask(__name__)
start_time = time.time()

VSTORAGE = os.environ.get("VSTORAGE_PATH", "/vstorage")
STORAGE_URL = os.environ.get("STORAGE_URL", "http://storage:8197")
PORT = int(os.environ.get("SERVICE2_PORT", 8198))

@app.route("/status")
def status():
    uptime = (time.time() - start_time) / 3600
    freeDisk = round(shutil.disk_usage("/").free // (1024 * 1024))

    record = f"Timestamp2: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}, uptime {uptime:.2f} hours, free disk in root: {freeDisk} MBytes"

    # Write status to vStorage
    try:
        with open(VSTORAGE, "a") as f:
            f.write(record + "\n")
    except Exception as e:
        print(f"[Error] Failed to write to vStorage: {e}")


    # Send status to Storage
    try:
        requests.post(f"{STORAGE_URL}/log", data=record, headers={"Content-Type": "text/plain"})
    except Exception as e:
        print(f"[Error] Failed to send status to Storage: {e}")

    return record, 200, {"Content-Type": "text/plain"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
