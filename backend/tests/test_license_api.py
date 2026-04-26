import pytest
from app.models.user import User

def test_generate_licenses_api(client, db_session):
    # Setup test user (admin)
    admin_user = User(email="admin_api@test.com", is_admin=True)
    db_session.add(admin_user)
    db_session.commit()
    
    # We need a token for the admin. Since we override get_current_user in real app,
    # we can mock auth or generate a real token.
    from app.core.security import create_access_token
    token = create_access_token({"sub": admin_user.id, "type": "access"})
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/admin/licenses/generate",
        headers=headers,
        json={"duration_days": 30, "tier": "pro", "count": 2}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0].startswith("PRO-30-")

def test_activate_license_api(client, db_session):
    # Setup test users
    admin_user = User(email="admin2_api@test.com", is_admin=True)
    normal_user = User(email="normal_api@test.com", is_admin=False)
    db_session.add_all([admin_user, normal_user])
    db_session.commit()
    
    # Create token for normal
    from app.core.security import create_access_token
    token = create_access_token({"sub": normal_user.id, "type": "access"})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Generate key directly via DB to test activate endpoint
    from app.services.license_service import LicenseService
    service = LicenseService(db_session)
    keys = service.generate_keys(admin_user, duration_days=30, count=1)
    
    response = client.post(
        "/api/subscriptions/activate",
        headers=headers,
        json={"code": keys[0]}
    )
    assert response.status_code == 200
    assert response.json() == {"success": True, "tier": "pro", "message": "Subscription activated successfully"}
