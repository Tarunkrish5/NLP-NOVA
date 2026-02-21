from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import time, asyncio, json, random
from contextlib import asynccontextmanager

# Patient Telemetry State
current_vitals = {
    "hr": 72,
    "o2": 98,
    "bp_sys": 120,
    "bp_dia": 80,
    "temp": 36.6,
    "status": "Stable"
}

surgical_log = []

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"📡 + New HUD connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"📡 - HUD disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"⚠️ Broadcast failure: {e}")
                dead_connections.append(connection)
        
        # Prune dead connections proactively
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()

async def generate_telemetry():
    global current_vitals
    while True:
        # Simulate realistic medical telemetry with drift and noise
        current_vitals["hr"] += random.randint(-1, 1)
        current_vitals["hr"] = max(50, min(140, current_vitals["hr"]))
        
        current_vitals["o2"] += random.randint(-1, 1)
        current_vitals["o2"] = max(90, min(100, current_vitals["o2"]))
        
        current_vitals["bp_sys"] += random.randint(-1, 1)
        current_vitals["bp_dia"] += random.randint(-1, 1)
        
        if current_vitals["hr"] > 110 or current_vitals["o2"] < 92:
            current_vitals["status"] = "Warning"
        elif current_vitals["hr"] > 130 or current_vitals["o2"] < 88:
            current_vitals["status"] = "Critical"
        else:
            current_vitals["status"] = "Stable"
            
        await manager.broadcast({
            "type": "TELEMETRY",
            "data": {
                **current_vitals,
                "bp": f"{current_vitals['bp_sys']}/{current_vitals['bp_dia']}"
            },
            "timestamp": time.time()
        })
        await asyncio.sleep(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start Telemetry Loop
    telemetry_task = asyncio.create_task(generate_telemetry())
    print("🚀 Telemetry Engine Started")
    yield
    # Shutdown: Cleanup
    telemetry_task.cancel()
    print("🛑 Telemetry Engine Halted")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.post("/action")
async def handle_action(request: Request):
    data = await request.json()
    action = data.get("action")
    timestamp = time.strftime("%H:%M:%S")
    
    log_entry = {
        "timestamp": timestamp,
        "action": action,
        "payload": data.get("text", "No extra data")
    }
    surgical_log.append(log_entry)
    if len(surgical_log) > 50: surgical_log.pop(0)
    
    print(f"🔥 [{timestamp}] Surgical Action Received: {action}")
    
    await manager.broadcast({
        "type": "ACTION",
        "log": log_entry
    })
    return {"status": "ACK", "action": action}

@app.get("/telemetry")
async def get_telemetry():
    return {
        **current_vitals,
        "bp": f"{current_vitals['bp_sys']}/{current_vitals['bp_dia']}"
    }

@app.get("/logs")
async def get_logs():
    return surgical_log

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)