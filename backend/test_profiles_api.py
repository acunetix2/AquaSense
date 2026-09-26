import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Test upsert
        upsert_payload = {
            "user_id": "test-google-user-123",
            "email": "tester@example.com",
            "full_name": "Test Google User",
            "avatar_url": "https://example.com/avatar.jpg",
            "role": "citizen",
            "bio": "Environmental watcher",
            "location": "Hudson Valley, NY",
            "website": "https://tester.dev"
        }
        res = await client.post("/api/v1/profiles/upsert", json=upsert_payload)
        print("Upsert response:", res.status_code, res.json())
        assert res.status_code == 200

        # 2. Test get /me
        res = await client.get("/api/v1/profiles/me", headers={"X-User-Id": "test-google-user-123"})
        print("Get me response:", res.status_code, res.json())
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "tester@example.com"
        assert data["location"] == "Hudson Valley, NY"

        # 3. Test update /me
        update_payload = {
            "bio": "Updated bio text for testing persistence!",
            "location": "Catskills, NY"
        }
        res = await client.patch("/api/v1/profiles/me", json=update_payload, headers={"X-User-Id": "test-google-user-123"})
        print("Update me response:", res.status_code, res.json())
        assert res.status_code == 200
        assert res.json()["bio"] == "Updated bio text for testing persistence!"
        assert res.json()["location"] == "Catskills, NY"

        # 4. Test public profile (no email exposed)
        res = await client.get("/api/v1/profiles/test-google-user-123")
        print("Public profile response:", res.status_code, res.json())
        assert res.status_code == 200
        assert "email" not in res.json()
        print("[+] ALL PROFILE TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(test())
