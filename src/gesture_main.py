import cv2, json, time, os, threading
import websocket
import pyautogui
from engine.gesture_engine import AetherGestureEngine
from logic.gestures import GestureRecognizer

# WebSocket Global
ws = None

def on_open(ws_conn):
    print("🚀 Neural Bridge Connected")
    global ws
    ws = ws_conn

def on_error(ws, error):
    print(f"❌ Bridge Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("📡 Bridge Closed")

def start_ws():
    ws_app = websocket.WebSocketApp("ws://localhost:8000/ws",
                              on_open=on_open,
                              on_error=on_error,
                              on_close=on_close)
    ws_app.run_forever()

# Start WS in background
threading.Thread(target=start_ws, daemon=True).start()

def main():
    engine = AetherGestureEngine()
    recognizer = GestureRecognizer()
    cap = cv2.VideoCapture(0)
    last_stream_time = 0

    print("\n--- GESTURE SYSTEM ACTIVE ---")

    while True:
        success, frame = cap.read()
        if not success: break
        
        frame = cv2.flip(frame, 1)
        lms = engine.process_frame(frame)
        current_action = "IDLE"

        if lms:
            for hand in lms:
                engine.draw_landmarks(frame, hand)
                current_action = recognizer.detect_gesture(hand)
                
                if current_action != "IDLE":
                    try:
                        # Direct WebSocket Transmission
                        if ws and ws.sock and ws.sock.connected:
                            payload = json.dumps({
                                "action": current_action,
                                "text": "",
                                "source": "gesture"
                            })
                            ws.send(payload)
                        else:
                            # Fallback to REST if socket is down
                            try:
                                payload = {"action": current_action, "text": "", "source": "gesture"}
                                requests.post("http://localhost:8000/command", json=payload, timeout=0.01)
                            except: pass
                        
                        # Save screenshot if Capture gesture detected
                        if current_action == "ACTION_CAPTURE":
                            if not os.path.exists("captures"):
                                os.makedirs("captures")
                            timestamp = time.strftime("%H%M%S")
                            filename = f"captures/nova_{timestamp}.jpg"
                            
                            # Taking a system-wide screenshot instead of camera frame
                            pyautogui.screenshot(filename)
                            print(f"📸 Screen captured: {filename}")
                    except Exception as e:
                        print(f"Capture error: {e}")

        cv2.putText(frame, f"HUD ACTION: {current_action}", (20, 40), 2, 0.8, (0,255,0), 2)
        cv2.imshow("Nova Gesture Engine", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()