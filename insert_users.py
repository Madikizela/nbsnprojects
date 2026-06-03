
import psycopg2

def main():
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host="localhost",
        database="nbsnproject",
        user="postgres",
        password="12345"
    )
    cur = conn.cursor()
    
    # First, insert Clients!
    print("Inserting Clients...")
    cur.execute("""
        INSERT INTO "Clients" ("Id", "Name", "Description", "Address", "PhoneNumber", "Email", "ContactPerson", "Status", "CreatedAt", "UpdatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT ("Id") DO NOTHING;
    """, (12, 'NBSN Projects ', 'Information Technology', '79 Coedmore Road', '+27733904588', 'Madikizela21517799@gmail.com', 'Sbusiso Madikizela', 1, '2026-05-18 19:02:08.067632', '2026-05-18 19:02:08.067724'))
    conn.commit()
    
    # Now insert SkillsDevelopmentProviders
    print("Inserting SkillsDevelopmentProviders...")
    cur.execute("""
        INSERT INTO "SkillsDevelopmentProviders" ("Id", "Name", "Description", "Address", "ContactPerson", "Status", "CreatedAt", "UpdatedAt", "ClientId")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT ("Id") DO NOTHING;
    """, (15, 'NBSN', 'Information Technology', '79 Coedmore Road, eThekwini Metropolitan Municipality, eThekwini Metropolitan Municipality, KwaZulu-Natal', 'Sbusiso Madikizela', 4, '2026-05-18 19:05:32.013381', '2026-05-18 19:05:32.013414', 12))
    conn.commit()
    
    # Now insert Departments
    print("Inserting Departments...")
    departments = [
        (1, 'Administration', '', 1, 1, 'Nokwe', 'Ngidi', 'ngidinokwe@gmail.com', '2026-05-18 19:23:49.817760', '2026-05-18 19:23:49.817870', 15),
        (2, 'Logistic', '', 2, 1, 'Nkwenkwezi', 'Maphango', 'ntikayezwenxasana@gmail.com', '2026-05-18 19:26:45.062897', '2026-05-18 19:26:45.062897', 15),
        (3, 'Quality Assurance', '', 4, 1, 'Ntsika', 'Maphango', 'maphangosbusiso@gmail.com', '2026-05-19 19:24:27.737532', '2026-05-19 19:24:27.737586', 15),
        (4, 'IT', '', 5, 1, 'Sbusiso', 'Madikizela', 'nbsnprojects@gmail.com', '2026-05-19 19:31:30.005101', '2026-05-19 19:31:30.005101', 15),
    ]
    for dept in departments:
        cur.execute("""
            INSERT INTO "Departments" ("Id", "Name", "Description", "Type", "Status", "ManagerFirstName", "ManagerSurname", "ManagerEmail", "CreatedAt", "UpdatedAt", "SkillsDevelopmentProviderId")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT ("Id") DO NOTHING;
        """, dept)
    conn.commit()
    
    # Now insert Users!
    print("Inserting Users...")
    users = [
        (7, 'Sbusiso Madikizela', '', 'Madikizela21517799@gmail.com', 'Madikizela21517799@gmail.com', '$2a$12$MpEWNXh3c5l.8lm1H51ATeGUConnvRpWkWuFYKJ32VNUgqlyZjr6m', '+27733904588', None, None, None, None, None, None, None, None, 2, 1, '2026-05-18 19:02:08.870138', '2026-05-18 19:02:08.870186', 12, 15, None, None),
        (8, 'Sbusiso', 'Madikizela', 'sthembisomaphango@gmail.com', 'sthembisomaphango@gmail.com', '$2a$12$QihkZzxS8iPp/7lizN1BRe.TnrenSu1o5gJ2tcGUtLOJhBfhr5IKW', '+27733904588', None, None, None, None, None, None, None, None, 3, 1, '2026-05-18 19:05:32.570575', '2026-05-18 19:05:32.570576', None, 15, None, None),
        (9, 'Nokwe', 'Ngidi', 'ngidinokwe@gmail.com', 'ngidinokwe@gmail.com', '$2a$12$wCv5ICbaEWkkUhgpxfLk8uPEShuQpx7bkm9dQTToUOxGJ/VGyWbEm', None, None, None, None, None, None, None, None, None, 3, 1, '2026-05-18 19:23:50.399722', '2026-05-18 19:23:50.399722', None, 15, 1, None),
        (10, 'Nkwenkwezi', 'Maphango', 'ntikayezwenxasana@gmail.com', 'ntikayezwenxasana@gmail.com', '$2a$12$GbZK09nHf0xlWPnuTUjcweWfrW7h0B/HQOgmc7NhIk8ms3zxksA3W', None, None, None, None, None, None, None, None, None, 5, 1, '2026-05-18 19:26:45.506688', '2026-05-18 19:26:45.506689', None, 15, 2, None),
        (11, 'Sbusiso', 'Madikizela', '', 'maphangontsika@gmail.com', '$2a$12$NedBRtGVoHWWGT2YspAYs.AWxa3O8EGXfeZ0E1Xv/gb5B4BcN2ob.', None, None, None, None, None, None, None, None, None, 16, 1, '2026-05-19 14:19:05.819465', '2026-05-19 14:19:05.819511', None, 15, None, None),
        (12, 'Ntsika', 'Maphango', 'maphangosbusiso@gmail.com', 'maphangosbusiso@gmail.com', '$2b$10$riVDWDCHarzqQ2S1qw7TF.OR5hOy0bJVpJDa8mqWetHmJc5jmzm2K', None, None, None, None, None, None, None, None, None, 7, 1, '2026-05-19 19:24:28.167541', '2026-05-19 19:24:28.167541', None, 15, 3, None),
        (13, 'Sbusiso', 'Madikizela', 'nbsnprojects@gmail.com', 'nbsnprojects@gmail.com', '$2a$12$4sooIMBdHpiwzv.gropRn.pUg5j4Zf.EHtpiUPZZpNeLpaBQrBDPu', None, None, None, None, None, None, None, None, None, 6, 1, '2026-05-19 19:31:30.378439', '2026-05-19 19:31:30.378440', None, 15, 4, None),
        (14, 'Lwemihla', 'Maphango', 'maphangolwemihla@gmail.com', 'maphangolwemihla@gmail.com', '$2a$12$NMSz.ekpHtFSxprUeEraoem69mVtI6KPGiLARF2UKFkPiJuWLp/eu', None, None, None, None, None, None, None, None, None, 8, 1, '2026-05-22 13:25:43.100388', '2026-05-22 13:25:43.100489', None, 15, 3, None),
    ]
    
    for user in users:
        cur.execute("""
            INSERT INTO "Users" ("Id", "FirstName", "LastName", "Username", "Email", "PasswordHash", "PhoneNumber", "AddressLine1", "AddressLine2", "City", "Province", "PostalCode", "ProfileImage", "Signature", "PracticeNumber", "Role", "Status", "CreatedAt", "UpdatedAt", "ClientId", "SkillsDevelopmentProviderId", "DepartmentId", "Initials")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT ("Id") DO NOTHING;
        """, user)
    conn.commit()
    
    # Reset sequences!
    print("Resetting sequences...")
    tables_with_id = ['Clients', 'SkillsDevelopmentProviders', 'Departments', 'Users']
    for table in tables_with_id:
        cur.execute(f"SELECT setval('\"{table}_Id_seq\"', COALESCE((SELECT MAX(\"Id\") FROM \"{table}\"), 1), TRUE);")
    conn.commit()
    
    cur.close()
    conn.close()
    print("Successfully imported users and related data!")
    print("User maphangolwemihla@gmail.com is now in the database!")

if __name__ == "__main__":
    main()
