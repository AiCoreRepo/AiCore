from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get('/test')
def test():
    return {'ok': True}

if __name__ == "__main__":
    print('Starting inline app')
    uvicorn.run(app, host='0.0.0.0', port=8000)
