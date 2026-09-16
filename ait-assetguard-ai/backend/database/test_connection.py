from database.connection import client, db

try:
    client.admin.command("ping")

    print("SUCCESS: MongoDB connection is working!")
    print(f"Database: {db.name}")

except Exception as e:
    print("ERROR: MongoDB connection failed")
    print(e)