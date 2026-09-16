from pymongo import MongoClient

try:
    client = MongoClient(
        "mongodb://localhost:27017/",
        serverSelectionTimeoutMS=5000
    )

    client.admin.command("ping")

    print("SUCCESS: MongoDB is connected!")

    db = client["ait_assetguard"]

    print("Database selected: ait_assetguard")

except Exception as e:
    print("ERROR: Could not connect to MongoDB")
    print(e)