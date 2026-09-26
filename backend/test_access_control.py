import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Create observation by user-A
        payload = {
            "site_name": "Test Access River",
            "latitude": 40.123,
            "longitude": -73.456,
            "image_url": "https://images.unsplash.com/test.jpg",
            "water_appearance": "clear",
            "odour": "none",
            "waste_visible": False,
            "flow_rate": "normal",
            "user_id": "user-A",
            "observer_name": "Alice"
        }
        res = await client.post("/api/v1/observations", json=payload)
        assert res.status_code == 201
        obs_id = res.json()["id"]

        # Check that email is redacted in public response
        assert res.json().get("observer_email") is None

        # User-B attempts to delete User-A's observation -> should 403
        del_res = await client.delete(f"/api/v1/observations/{obs_id}", headers={"X-User-Id": "user-B"})
        print("Unauthorized delete attempt:", del_res.status_code)
        assert del_res.status_code == 403

        # User-A deletes their own observation -> should 204
        del_res_ok = await client.delete(f"/api/v1/observations/{obs_id}", headers={"X-User-Id": "user-A"})
        print("Authorized delete attempt:", del_res_ok.status_code)
        assert del_res_ok.status_code == 204

        print("[+] ACCESS CONTROL TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(test())
