-- Gift Registry Management Tables

-- Registry providers (stores/websites)
CREATE TABLE IF NOT EXISTS registry_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN (
        'department_store', 'home_goods', 'online_marketplace', 
        'specialty_store', 'charity', 'honeymoon_fund', 'cash_fund', 'other'
    )),
    website_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Couple's registries
CREATE TABLE IF NOT EXISTS gift_registries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES registry_providers(id) ON DELETE SET NULL,
    registry_name VARCHAR(255) NOT NULL,
    registry_url TEXT,
    registry_id VARCHAR(255), -- External registry ID/number
    custom_provider_name VARCHAR(255), -- For custom/other providers
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(couple_id, provider_id, registry_id)
);

-- Registry items
CREATE TABLE IF NOT EXISTS registry_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_id UUID NOT NULL REFERENCES gift_registries(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10,2),
    quantity_requested INTEGER DEFAULT 1,
    quantity_received INTEGER DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'must_have')),
    item_url TEXT,
    image_url TEXT,
    notes TEXT,
    is_fulfilled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gift contributions/purchases
CREATE TABLE IF NOT EXISTS gift_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES registry_items(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    contributor_name VARCHAR(255), -- For anonymous or non-guest contributors
    contributor_email VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    amount DECIMAL(10,2), -- For partial contributions
    contribution_type VARCHAR(50) DEFAULT 'full' CHECK (contribution_type IN ('full', 'partial', 'group')),
    purchase_date DATE DEFAULT CURRENT_DATE,
    thank_you_sent BOOLEAN DEFAULT false,
    thank_you_sent_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gift categories for organization
CREATE TABLE IF NOT EXISTS gift_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(couple_id, category_name)
);

-- Cash fund categories
CREATE TABLE IF NOT EXISTS cash_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    fund_name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0,
    fund_type VARCHAR(50) DEFAULT 'other' CHECK (fund_type IN (
        'honeymoon', 'home', 'charity', 'experience', 'savings', 'other'
    )),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cash fund contributions
CREATE TABLE IF NOT EXISTS cash_fund_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES cash_funds(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    contributor_name VARCHAR(255),
    contributor_email VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    contribution_date DATE DEFAULT CURRENT_DATE,
    thank_you_sent BOOLEAN DEFAULT false,
    thank_you_sent_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_gift_registries_couple_id ON gift_registries(couple_id);
CREATE INDEX idx_registry_items_registry_id ON registry_items(registry_id);
CREATE INDEX idx_registry_items_is_fulfilled ON registry_items(is_fulfilled);
CREATE INDEX idx_gift_contributions_item_id ON gift_contributions(item_id);
CREATE INDEX idx_gift_contributions_guest_id ON gift_contributions(guest_id);
CREATE INDEX idx_cash_funds_couple_id ON cash_funds(couple_id);
CREATE INDEX idx_cash_fund_contributions_fund_id ON cash_fund_contributions(fund_id);

-- RLS Policies
ALTER TABLE registry_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_registries ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_fund_contributions ENABLE ROW LEVEL SECURITY;

-- Registry providers are public read
CREATE POLICY "Registry providers are publicly readable"
    ON registry_providers FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Couples can manage their registries
CREATE POLICY "Couples can view their registries"
    ON gift_registries FOR SELECT
    TO authenticated
    USING (couple_id IN (
        SELECT id FROM couples WHERE user_id = auth.uid()
    ));

CREATE POLICY "Couples can create registries"
    ON gift_registries FOR INSERT
    TO authenticated
    WITH CHECK (couple_id IN (
        SELECT id FROM couples WHERE user_id = auth.uid()
    ));

CREATE POLICY "Couples can update their registries"
    ON gift_registries FOR UPDATE
    TO authenticated
    USING (couple_id IN (
        SELECT id FROM couples WHERE user_id = auth.uid()
    ));

CREATE POLICY "Couples can delete their registries"
    ON gift_registries FOR DELETE
    TO authenticated
    USING (couple_id IN (
        SELECT id FROM couples WHERE user_id = auth.uid()
    ));

-- Registry items policies
CREATE POLICY "Couples can manage registry items"
    ON registry_items FOR ALL
    TO authenticated
    USING (registry_id IN (
        SELECT id FROM gift_registries WHERE couple_id IN (
            SELECT id FROM couples WHERE user_id = auth.uid()
        )
    ));

-- Gift contributions policies
CREATE POLICY "Couples can view contributions"
    ON gift_contributions FOR SELECT
    TO authenticated
    USING (item_id IN (
        SELECT id FROM registry_items WHERE registry_id IN (
            SELECT id FROM gift_registries WHERE couple_id IN (
                SELECT id FROM couples WHERE user_id = auth.uid()
            )
        )
    ));

-- Gift categories policies
CREATE POLICY "Couples can manage gift categories"
    ON gift_categories FOR ALL
    TO authenticated
    USING (couple_id IN (
        SELECT id FROM couples WHERE user_id = auth.uid()
    ));

-- Cash funds policies
CREATE POLICY "Couples can manage cash funds"
    ON cash_funds FOR ALL
    TO authenticated
    USING (couple_id IN (
        SELECT id FROM couples WHERE user_id = auth.uid()
    ));

-- Cash fund contributions policies
CREATE POLICY "Couples can view cash contributions"
    ON cash_fund_contributions FOR SELECT
    TO authenticated
    USING (fund_id IN (
        SELECT id FROM cash_funds WHERE couple_id IN (
            SELECT id FROM couples WHERE user_id = auth.uid()
        )
    ));

-- Functions

-- Function to update cash fund amounts
CREATE OR REPLACE FUNCTION update_cash_fund_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cash_funds
    SET current_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM cash_fund_contributions
        WHERE fund_id = NEW.fund_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.fund_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cash fund amounts
CREATE TRIGGER update_fund_amount_on_contribution
AFTER INSERT OR UPDATE OR DELETE ON cash_fund_contributions
FOR EACH ROW
EXECUTE FUNCTION update_cash_fund_amount();

-- Function to update item fulfillment status
CREATE OR REPLACE FUNCTION update_item_fulfillment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE registry_items
    SET is_fulfilled = (quantity_received >= quantity_requested),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update item fulfillment
CREATE TRIGGER update_fulfillment_on_contribution
AFTER INSERT OR UPDATE ON gift_contributions
FOR EACH ROW
EXECUTE FUNCTION update_item_fulfillment();

-- Function to get registry statistics
CREATE OR REPLACE FUNCTION get_registry_statistics(p_couple_id UUID)
RETURNS TABLE (
    total_registries INTEGER,
    total_items INTEGER,
    fulfilled_items INTEGER,
    total_value DECIMAL,
    received_value DECIMAL,
    fulfillment_percentage INTEGER,
    total_cash_funds INTEGER,
    cash_funds_target DECIMAL,
    cash_funds_received DECIMAL,
    total_contributors INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH registry_stats AS (
        SELECT 
            COUNT(DISTINCT gr.id) as total_registries,
            COUNT(DISTINCT ri.id) as total_items,
            COUNT(DISTINCT CASE WHEN ri.is_fulfilled THEN ri.id END) as fulfilled_items,
            COALESCE(SUM(ri.price * ri.quantity_requested), 0) as total_value,
            COALESCE(SUM(
                CASE 
                    WHEN ri.is_fulfilled THEN ri.price * ri.quantity_requested
                    ELSE ri.price * ri.quantity_received
                END
            ), 0) as received_value
        FROM gift_registries gr
        LEFT JOIN registry_items ri ON ri.registry_id = gr.id
        WHERE gr.couple_id = p_couple_id AND gr.is_active = true
    ),
    cash_stats AS (
        SELECT 
            COUNT(DISTINCT cf.id) as total_cash_funds,
            COALESCE(SUM(cf.target_amount), 0) as cash_funds_target,
            COALESCE(SUM(cf.current_amount), 0) as cash_funds_received
        FROM cash_funds cf
        WHERE cf.couple_id = p_couple_id AND cf.is_active = true
    ),
    contributor_stats AS (
        SELECT COUNT(DISTINCT COALESCE(contributor_email, contributor_name)) as total_contributors
        FROM (
            SELECT gc.contributor_email, gc.contributor_name
            FROM gift_contributions gc
            JOIN registry_items ri ON ri.id = gc.item_id
            JOIN gift_registries gr ON gr.id = ri.registry_id
            WHERE gr.couple_id = p_couple_id
            
            UNION
            
            SELECT cfc.contributor_email, cfc.contributor_name
            FROM cash_fund_contributions cfc
            JOIN cash_funds cf ON cf.id = cfc.fund_id
            WHERE cf.couple_id = p_couple_id AND NOT cfc.is_anonymous
        ) contributors
    )
    SELECT 
        rs.total_registries::INTEGER,
        rs.total_items::INTEGER,
        rs.fulfilled_items::INTEGER,
        rs.total_value,
        rs.received_value,
        CASE 
            WHEN rs.total_items > 0 
            THEN (rs.fulfilled_items * 100 / rs.total_items)::INTEGER
            ELSE 0
        END as fulfillment_percentage,
        cs.total_cash_funds::INTEGER,
        cs.cash_funds_target,
        cs.cash_funds_received,
        cont.total_contributors::INTEGER
    FROM registry_stats rs, cash_stats cs, contributor_stats cont;
END;
$$ LANGUAGE plpgsql;

-- Insert default registry providers
INSERT INTO registry_providers (provider_name, provider_type, website_url) VALUES
    ('Amazon', 'online_marketplace', 'https://www.amazon.com'),
    ('Target', 'department_store', 'https://www.target.com'),
    ('Bed Bath & Beyond', 'home_goods', 'https://www.bedbathandbeyond.com'),
    ('Williams Sonoma', 'home_goods', 'https://www.williams-sonoma.com'),
    ('Crate & Barrel', 'home_goods', 'https://www.crateandbarrel.com'),
    ('Macy''s', 'department_store', 'https://www.macys.com'),
    ('Zola', 'online_marketplace', 'https://www.zola.com'),
    ('The Knot', 'online_marketplace', 'https://registry.theknot.com'),
    ('Honeyfund', 'honeymoon_fund', 'https://www.honeyfund.com'),
    ('Custom/Other', 'other', NULL)
ON CONFLICT DO NOTHING;