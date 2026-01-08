import { MigrationInterface, QueryRunner } from "typeorm";

export class InitKoreaBizDirectory1700000000000 implements MigrationInterface {
  name = "InitKoreaBizDirectory1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // UUID support
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // =========================
    // ENUMS
    // =========================
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enterprise_status') THEN
          CREATE TYPE enterprise_status AS ENUM ('ACTIVE','HIDDEN','SUSPENDED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
          CREATE TYPE review_status AS ENUM ('PENDING','PUBLISHED','REJECTED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
          CREATE TYPE claim_status AS ENUM ('SUBMITTED','IN_REVIEW','APPROVED','REJECTED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('ADMIN','OWNER','STAFF','USER');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_kind') THEN
          CREATE TYPE media_kind AS ENUM ('LOGO','GALLERY');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
          CREATE TYPE subscription_tier AS ENUM ('FREE','BASIC','PRO','ENTERPRISE');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
          CREATE TYPE staff_role AS ENUM ('MANAGER','EDITOR','VIEWER');
        END IF;
      END
      $$;
    `);

    // =========================
    // USERS (needed for ownership, moderation, audit)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE,
        password_hash text,
        display_name text,
        role user_role NOT NULL DEFAULT 'USER',
        email_verified boolean NOT NULL DEFAULT false,
        is_active boolean NOT NULL DEFAULT true,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

    // =========================
    // RBAC SYSTEM
    // =========================
    
    // Permissions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL UNIQUE,
        description text,
        resource text NOT NULL, -- 'enterprise', 'review', 'user', 'system'
        action text NOT NULL,   -- 'create', 'read', 'update', 'delete', 'moderate'
        
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);`);

    // Role-Permission mapping
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role user_role NOT NULL,
        permission_id uuid NOT NULL,
        
        PRIMARY KEY (role, permission_id),
        
        CONSTRAINT fk_rp_permission
          FOREIGN KEY (permission_id) REFERENCES permissions(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    // =========================
    // CITIES + CATEGORIES
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        name text NOT NULL,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text NOT NULL UNIQUE,
        name text NOT NULL,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // =========================
    // ENTERPRISES (core)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enterprises (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        legal_name text,
        short_description text,
        description text,

        verified boolean NOT NULL DEFAULT false,

        owner_user_id uuid NULL,
        city_id uuid NULL,

        rating_avg numeric(2,1) NOT NULL DEFAULT 0.0,
        rating_count int NOT NULL DEFAULT 0,

        price_range smallint,
        founded_year smallint,
        employee_range text,

        status enterprise_status NOT NULL DEFAULT 'ACTIVE',

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      );
    `);

    await queryRunner.query(`
      ALTER TABLE enterprises
      ADD CONSTRAINT fk_enterprises_owner
      FOREIGN KEY (owner_user_id) REFERENCES users(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE enterprises
      ADD CONSTRAINT fk_enterprises_city
      FOREIGN KEY (city_id) REFERENCES cities(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_enterprises_status ON enterprises(status);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_enterprises_verified ON enterprises(verified);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_enterprises_owner ON enterprises(owner_user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_enterprises_city ON enterprises(city_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_enterprises_updated_at ON enterprises(updated_at);`);

    // Enterprise-specific staff assignments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enterprise_staff (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id uuid NOT NULL,
        user_id uuid NOT NULL,
        role staff_role NOT NULL DEFAULT 'VIEWER',
        
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        
        CONSTRAINT fk_staff_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
          
        CONSTRAINT fk_staff_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
          
        UNIQUE(enterprise_id, user_id)
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_staff_enterprise ON enterprise_staff(enterprise_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_staff_user ON enterprise_staff(user_id);`);

    // Many-to-many: enterprises <-> categories
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enterprise_categories (
        enterprise_id uuid NOT NULL,
        category_id uuid NOT NULL,

        PRIMARY KEY (enterprise_id, category_id),

        CONSTRAINT fk_ec_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,

        CONSTRAINT fk_ec_category
          FOREIGN KEY (category_id) REFERENCES categories(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_ec_category ON enterprise_categories(category_id);`);

    // =========================
    // ENTERPRISE HOURS (Open-now logic support)
    // - Timezone is app-level Asia/Seoul, but we store schedule in local times.
    // - Overnight supported via open_time/close_time (app logic)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enterprise_hours (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id uuid NOT NULL,

        day_of_week smallint NOT NULL, -- 0=Mon ... 6=Sun (choose and keep consistent in app)
        is_closed boolean NOT NULL DEFAULT false,
        open_time time,
        close_time time,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT fk_hours_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,

        CONSTRAINT ck_hours_day_of_week
          CHECK (day_of_week >= 0 AND day_of_week <= 6)
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_hours_enterprise_day
      ON enterprise_hours(enterprise_id, day_of_week);
    `);

    // Optional: specific closed dates override times (holidays, etc.)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enterprise_closed_days (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id uuid NOT NULL,
        closed_date date NOT NULL,
        note text,

        created_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT fk_closed_days_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_closed_day_enterprise_date
      ON enterprise_closed_days(enterprise_id, closed_date);
    `);

    // =========================
    // MEDIA (S3/R2 metadata)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enterprise_media (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id uuid NOT NULL,

        kind media_kind NOT NULL, -- LOGO / GALLERY
        storage_key text NOT NULL,
        content_type text,
        bytes bigint,
        width int,
        height int,
        sort_order int NOT NULL DEFAULT 0,

        created_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,

        CONSTRAINT fk_media_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_media_enterprise ON enterprise_media(enterprise_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_media_kind ON enterprise_media(kind);`);

    // =========================
    // REVIEWS (Moderation-first)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id uuid NOT NULL,

        author_user_id uuid NULL,
        author_name text,
        rating smallint NOT NULL,
        comment text,

        status review_status NOT NULL DEFAULT 'PENDING',

        ip_hash text,
        user_agent_hash text,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,

        CONSTRAINT fk_reviews_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,

        CONSTRAINT fk_reviews_author
          FOREIGN KEY (author_user_id) REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,

        CONSTRAINT ck_reviews_rating
          CHECK (rating >= 1 AND rating <= 5)
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_reviews_enterprise ON reviews(enterprise_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_reviews_author ON reviews(author_user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);`);

    // =========================
    // CLAIMS (Ownership workflow)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS claims (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id uuid NOT NULL,

        requester_user_id uuid NULL,
        requester_name text,
        requester_email text,
        requester_phone text,
        position text,
        proof_of_ownership text,

        status claim_status NOT NULL DEFAULT 'SUBMITTED',

        reviewed_by_user_id uuid NULL,
        review_notes text,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,

        CONSTRAINT fk_claims_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,

        CONSTRAINT fk_claims_requester
          FOREIGN KEY (requester_user_id) REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,

        CONSTRAINT fk_claims_reviewer
          FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_claims_enterprise ON claims(enterprise_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_claims_requester ON claims(requester_user_id);`);

    // =========================
    // AUDIT LOG (Mandatory)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        actor_user_id uuid NULL,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id uuid NULL,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

        created_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT fk_audit_actor
          FOREIGN KEY (actor_user_id) REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id);`);

    // =========================
    // SUBSCRIPTIONS + PLANS (Monetization & entitlements)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tier subscription_tier NOT NULL UNIQUE, -- FREE/BASIC/PRO/ENTERPRISE

        gallery_limit int NOT NULL,
        featured_listing boolean NOT NULL DEFAULT false,
        analytics boolean NOT NULL DEFAULT false,
        priority_support boolean NOT NULL DEFAULT false,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id uuid NOT NULL UNIQUE,

        tier subscription_tier NOT NULL DEFAULT 'FREE',
        status text NOT NULL DEFAULT 'ACTIVE', -- keep flexible; app can treat as enum later
        current_period_start timestamptz,
        current_period_end timestamptz,

        provider text,               -- e.g., stripe
        provider_customer_id text,
        provider_subscription_id text,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT fk_sub_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);`);

    // Seed default plans (matches your entitlement table)
    await queryRunner.query(`
      INSERT INTO subscription_plans (tier, gallery_limit, featured_listing, analytics, priority_support)
      VALUES
        ('FREE', 3, false, false, false),
        ('BASIC', 10, false, false, false),
        ('PRO', 30, true, true, false),
        ('ENTERPRISE', 2147483647, true, true, true)
      ON CONFLICT (tier) DO NOTHING;
    `);

    // Seed permissions
    await queryRunner.query(`
      INSERT INTO permissions (name, description, resource, action) VALUES
        ('enterprise.create', 'Create new enterprises', 'enterprise', 'create'),
        ('enterprise.read', 'View enterprise details', 'enterprise', 'read'),
        ('enterprise.update', 'Edit enterprise information', 'enterprise', 'update'),
        ('enterprise.delete', 'Delete enterprises', 'enterprise', 'delete'),
        ('enterprise.verify', 'Verify enterprises', 'enterprise', 'moderate'),
        ('review.create', 'Submit reviews', 'review', 'create'),
        ('review.read', 'View reviews', 'review', 'read'),
        ('review.moderate', 'Approve/reject reviews', 'review', 'moderate'),
        ('review.delete', 'Delete reviews', 'review', 'delete'),
        ('user.read', 'View user profiles', 'user', 'read'),
        ('user.update', 'Edit user profiles', 'user', 'update'),
        ('user.delete', 'Delete users', 'user', 'delete'),
        ('system.admin', 'Full system access', 'system', 'admin')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed role permissions
    await queryRunner.query(`
      INSERT INTO role_permissions (role, permission_id)
      SELECT 'ADMIN', id FROM permissions
      ON CONFLICT DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO role_permissions (role, permission_id)
      SELECT 'OWNER', id FROM permissions 
      WHERE name IN ('enterprise.read', 'enterprise.update', 'review.read')
      ON CONFLICT DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO role_permissions (role, permission_id)
      SELECT 'STAFF', id FROM permissions 
      WHERE name IN ('enterprise.read', 'review.read')
      ON CONFLICT DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO role_permissions (role, permission_id)
      SELECT 'USER', id FROM permissions 
      WHERE name IN ('enterprise.read', 'review.create', 'review.read', 'user.read')
      ON CONFLICT DO NOTHING;
    `);

    // =========================
    // ANALYTICS (Privacy-first, aggregated daily)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enterprise_analytics_daily (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id uuid NOT NULL,

        day date NOT NULL,
        page_views int NOT NULL DEFAULT 0,
        search_impressions int NOT NULL DEFAULT 0,
        cta_clicks int NOT NULL DEFAULT 0,

        created_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT fk_analytics_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_analytics_enterprise_day
      ON enterprise_analytics_daily(enterprise_id, day);
    `);

    // =========================
    // FAVORITES (Registered user feature)
    // =========================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        user_id uuid NOT NULL,
        enterprise_id uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),

        PRIMARY KEY (user_id, enterprise_id),

        CONSTRAINT fk_fav_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,

        CONSTRAINT fk_fav_enterprise
          FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_fav_enterprise ON favorites(enterprise_id);`);

    // =========================
    // Helpful partial index: only published reviews affect rating
    // =========================
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_published_enterprise
      ON reviews(enterprise_id, created_at)
      WHERE status = 'PUBLISHED' AND deleted_at IS NULL;
    `);

    // =========================
    // updated_at auto-touch (optional but useful)
    // =========================
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    const touchTables = [
      "users",
      "cities",
      "categories",
      "enterprises",
      "enterprise_hours",
      "reviews",
      "claims",
      "subscription_plans",
      "subscriptions",
      "enterprise_staff",
    ];

    for (const t of touchTables) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'trg_${t}_updated_at'
          ) THEN
            CREATE TRIGGER trg_${t}_updated_at
            BEFORE UPDATE ON ${t}
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
          END IF;
        END$$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers first
    const touchTables = [
      "enterprise_staff",
      "subscriptions",
      "subscription_plans",
      "claims",
      "reviews",
      "enterprise_hours",
      "enterprises",
      "categories",
      "cities",
      "users",
    ];

    for (const t of touchTables) {
      await queryRunner.query(`DROP TRIGGER IF EXISTS trg_${t}_updated_at ON ${t};`);
    }

    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at;`);

    // Drop tables (reverse dependency order)
    await queryRunner.query(`DROP TABLE IF EXISTS favorites;`);
    await queryRunner.query(`DROP TABLE IF EXISTS enterprise_analytics_daily;`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_plans;`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_log;`);
    await queryRunner.query(`DROP TABLE IF EXISTS claims;`);
    await queryRunner.query(`DROP TABLE IF EXISTS reviews;`);
    await queryRunner.query(`DROP TABLE IF EXISTS enterprise_media;`);
    await queryRunner.query(`DROP TABLE IF EXISTS enterprise_closed_days;`);
    await queryRunner.query(`DROP TABLE IF EXISTS enterprise_hours;`);
    await queryRunner.query(`DROP TABLE IF EXISTS enterprise_categories;`);
    await queryRunner.query(`DROP TABLE IF EXISTS enterprises;`);
    await queryRunner.query(`DROP TABLE IF EXISTS enterprise_staff;`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories;`);
    await queryRunner.query(`DROP TABLE IF EXISTS cities;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS staff_role;`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_tier;`);
    await queryRunner.query(`DROP TYPE IF EXISTS media_kind;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role;`);
    await queryRunner.query(`DROP TYPE IF EXISTS claim_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS review_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS enterprise_status;`);
  }
}