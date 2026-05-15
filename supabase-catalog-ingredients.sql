-- ============================================================
-- MIXTURA — Catalogue d'ingrédients partagé
-- Table en lecture seule pour tous les utilisateurs connectés
-- ============================================================

create table if not exists public.catalog_ingredients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  brand       text,
  category    text not null,
  type        text not null check (type in ('spirit','liqueur','wine','beer','juice','syrup','fresh','dry','other')),
  default_format  numeric not null default 70,
  default_unit    text not null default 'cl',
  typical_price   numeric,        -- prix TTC France (bouteille standard)
  abv             numeric,        -- % vol
  country         text,
  tags            text[] default '{}'
);

create index if not exists idx_catalog_ing_type     on public.catalog_ingredients(type);
create index if not exists idx_catalog_ing_category on public.catalog_ingredients(category);
create index if not exists idx_catalog_ing_name     on public.catalog_ingredients using gin(to_tsvector('french', name));

alter table public.catalog_ingredients enable row level security;

drop policy if exists "catalog public read" on public.catalog_ingredients;
create policy "catalog public read"
  on public.catalog_ingredients for select
  using (true);

-- ============================================================
-- SEED : ~130 références par catégorie
-- ============================================================

insert into public.catalog_ingredients
  (name, brand, category, type, default_format, default_unit, typical_price, abv, country, tags)
values

-- ── GIN ─────────────────────────────────────────────────────
('Hendrick''s', 'Hendrick''s', 'Gin', 'spirit', 70, 'cl', 38.00, 41.4, 'Écosse', '{floral,concombre,rose}'),
('Tanqueray London Dry', 'Tanqueray', 'Gin', 'spirit', 70, 'cl', 22.00, 43.1, 'Écosse', '{classique,junipérus}'),
('Bombay Sapphire', 'Bombay', 'Gin', 'spirit', 70, 'cl', 24.00, 40, 'Angleterre', '{floral,agrumes}'),
('Monkey 47', 'Black Forest', 'Gin', 'spirit', 50, 'cl', 42.00, 47, 'Allemagne', '{complexe,botanique}'),
('Beefeater London Dry', 'Beefeater', 'Gin', 'spirit', 70, 'cl', 18.00, 40, 'Angleterre', '{classique,junipérus}'),
('Plymouth Gin', 'Plymouth', 'Gin', 'spirit', 70, 'cl', 28.00, 41.2, 'Angleterre', '{terreux,doux}'),
('Citadelle', 'Citadelle', 'Gin', 'spirit', 70, 'cl', 25.00, 44, 'France', '{français,botanique}'),
('Gin Mare', 'Global Premium Brands', 'Gin', 'spirit', 70, 'cl', 40.00, 42.7, 'Espagne', '{méditerranéen,olive,thym}'),
('Roku', 'Suntory', 'Gin', 'spirit', 70, 'cl', 35.00, 43, 'Japon', '{sakura,yuzu,japonais}'),
('The Botanist', 'Bruichladdich', 'Gin', 'spirit', 70, 'cl', 38.00, 46, 'Écosse', '{botanique,islay}'),

-- ── VODKA ───────────────────────────────────────────────────
('Grey Goose', 'Grey Goose', 'Vodka', 'spirit', 70, 'cl', 45.00, 40, 'France', '{premium,blé}'),
('Absolut', 'Absolut', 'Vodka', 'spirit', 70, 'cl', 18.00, 40, 'Suède', '{classique,neutre}'),
('Belvedere', 'Belvedere', 'Vodka', 'spirit', 70, 'cl', 45.00, 40, 'Pologne', '{premium,seigle}'),
('Ketel One', 'Nolet', 'Vodka', 'spirit', 70, 'cl', 28.00, 40, 'Pays-Bas', '{crisp,propre}'),
('Stolichnaya', 'SPI Group', 'Vodka', 'spirit', 70, 'cl', 20.00, 40, 'Lettonie', '{classique}'),
('Cîroc', 'Diageo', 'Vodka', 'spirit', 70, 'cl', 42.00, 40, 'France', '{raisin,smooth}'),
('Smirnoff No.21', 'Diageo', 'Vodka', 'spirit', 70, 'cl', 14.00, 37.5, 'Russie', '{classique,accessible}'),

-- ── RHUM ────────────────────────────────────────────────────
('Diplomático Reserva Exclusiva', 'Diplomático', 'Rhum', 'spirit', 70, 'cl', 42.00, 40, 'Venezuela', '{vieux,riche,caramel}'),
('Ron Zacapa 23', 'Zacapa', 'Rhum', 'spirit', 70, 'cl', 48.00, 40, 'Guatemala', '{premium,vieux}'),
('Bacardí Carta Blanca', 'Bacardí', 'Rhum', 'spirit', 70, 'cl', 15.00, 37.5, 'Porto Rico', '{blanc,léger}'),
('Havana Club 7 ans', 'Pernod Ricard', 'Rhum', 'spirit', 70, 'cl', 28.00, 40, 'Cuba', '{cubain,vieux}'),
('Havana Club 3 ans', 'Pernod Ricard', 'Rhum', 'spirit', 70, 'cl', 18.00, 40, 'Cuba', '{cubain,blanc}'),
('Clément VSOP', 'Habitation Clément', 'Rhum Agricole', 'spirit', 70, 'cl', 35.00, 42, 'Martinique', '{agricole,vieux}'),
('J.M Blanc 50°', 'Distillerie J.M', 'Rhum Agricole', 'spirit', 70, 'cl', 32.00, 50, 'Martinique', '{agricole,blanc,fort}'),
('Mount Gay Eclipse', 'Mount Gay', 'Rhum', 'spirit', 70, 'cl', 22.00, 40, 'Barbade', '{classique,épicé}'),
('Plantation 3 Stars', 'Plantation', 'Rhum', 'spirit', 70, 'cl', 22.00, 41.2, 'Barbade', '{blanc,polyvalent}'),
('Appleton Estate 12 ans', 'Appleton', 'Rhum', 'spirit', 70, 'cl', 38.00, 43, 'Jamaïque', '{jamaïcain,fruité}'),

-- ── WHISKY / WHISKEY ────────────────────────────────────────
('Jameson Irish Whiskey', 'Jameson', 'Whiskey', 'spirit', 70, 'cl', 25.00, 40, 'Irlande', '{irlandais,smooth,triple distillé}'),
('Jack Daniel''s Old No.7', 'Brown-Forman', 'Whiskey', 'spirit', 70, 'cl', 28.00, 40, 'États-Unis', '{tennessee,classique,vanille}'),
('Maker''s Mark', 'Beam Suntory', 'Bourbon', 'spirit', 70, 'cl', 32.00, 45, 'États-Unis', '{bourbon,doux,froment}'),
('Bulleit Bourbon', 'Diageo', 'Bourbon', 'spirit', 70, 'cl', 28.00, 45, 'États-Unis', '{bourbon,épicé}'),
('Buffalo Trace', 'Sazerac', 'Bourbon', 'spirit', 70, 'cl', 28.00, 40, 'États-Unis', '{bourbon,premium,vanille}'),
('Glenfiddich 12 ans', 'William Grant', 'Single Malt', 'spirit', 70, 'cl', 38.00, 40, 'Écosse', '{speyside,fruité,poire}'),
('Monkey Shoulder', 'William Grant', 'Blended Malt', 'spirit', 70, 'cl', 30.00, 40, 'Écosse', '{accessible,doux}'),
('The Glenlivet 12 ans', 'Pernod Ricard', 'Single Malt', 'spirit', 70, 'cl', 38.00, 40, 'Écosse', '{speyside,fruité}'),
('Laphroaig 10 ans', 'Beam Suntory', 'Single Malt', 'spirit', 70, 'cl', 45.00, 40, 'Écosse', '{islay,tourbé,iodé}'),
('Johnnie Walker Black', 'Diageo', 'Blended Scotch', 'spirit', 70, 'cl', 30.00, 40, 'Écosse', '{blended,fumé}'),
('Chivas Regal 12 ans', 'Pernod Ricard', 'Blended Scotch', 'spirit', 70, 'cl', 30.00, 40, 'Écosse', '{blended,doux}'),

-- ── TEQUILA / MEZCAL ────────────────────────────────────────
('Patrón Silver', 'Patrón', 'Tequila', 'spirit', 70, 'cl', 48.00, 40, 'Mexique', '{blanco,agave,propre}'),
('Don Julio Blanco', 'Diageo', 'Tequila', 'spirit', 70, 'cl', 52.00, 38, 'Mexique', '{blanco,premium}'),
('Casamigos Blanco', 'Casamigos', 'Tequila', 'spirit', 70, 'cl', 48.00, 40, 'Mexique', '{blanco,smooth}'),
('Espolòn Blanco', 'Campari', 'Tequila', 'spirit', 70, 'cl', 28.00, 40, 'Mexique', '{blanco,accessible}'),
('José Cuervo Silver', 'Cuervo', 'Tequila', 'spirit', 70, 'cl', 22.00, 38, 'Mexique', '{classique}'),
('Del Maguey Vida', 'Del Maguey', 'Mezcal', 'spirit', 70, 'cl', 55.00, 42, 'Mexique', '{artisanal,fumé,agave}'),
('Ilegal Joven', 'Ilegal', 'Mezcal', 'spirit', 70, 'cl', 42.00, 40, 'Mexique', '{joven,fumé}'),

-- ── COGNAC / ARMAGNAC ───────────────────────────────────────
('Hennessy VS', 'Hennessy', 'Cognac', 'spirit', 70, 'cl', 35.00, 40, 'France', '{cognac,classique}'),
('Rémy Martin VSOP', 'Rémy Martin', 'Cognac', 'spirit', 70, 'cl', 45.00, 40, 'France', '{cognac,vsop,fruité}'),
('Courvoisier VS', 'Beam Suntory', 'Cognac', 'spirit', 70, 'cl', 30.00, 40, 'France', '{cognac,accessible}'),
('Martell VS', 'Pernod Ricard', 'Cognac', 'spirit', 70, 'cl', 30.00, 40, 'France', '{cognac,floral}'),

-- ── LIQUEURS ORANGE / TRIPLE SEC ────────────────────────────
('Cointreau', 'Cointreau', 'Triple Sec', 'liqueur', 70, 'cl', 28.00, 40, 'France', '{orange,incontournable}'),
('Grand Marnier Cordon Rouge', 'Campari', 'Triple Sec', 'liqueur', 70, 'cl', 32.00, 40, 'France', '{orange,cognac}'),
('Curaçao Triple Sec Bols', 'Bols', 'Triple Sec', 'liqueur', 70, 'cl', 15.00, 38, 'Pays-Bas', '{orange,accessible}'),
('Blue Curaçao Bols', 'Bols', 'Curaçao', 'liqueur', 70, 'cl', 14.00, 21, 'Pays-Bas', '{bleu,orange,coloré}'),

-- ── LIQUEURS CAFÉ / CACAO ───────────────────────────────────
('Kahlúa', 'Pernod Ricard', 'Liqueur Café', 'liqueur', 70, 'cl', 22.00, 16, 'Mexique', '{café,vanille}'),
('Tia Maria', 'De Kuyper', 'Liqueur Café', 'liqueur', 70, 'cl', 22.00, 20, 'Jamaïque', '{café,rhum}'),
('Crème de Cacao Blanc Bols', 'Bols', 'Cacao', 'liqueur', 70, 'cl', 12.00, 24, 'Pays-Bas', '{cacao,blanc}'),
('Crème de Cacao Brun Bols', 'Bols', 'Cacao', 'liqueur', 70, 'cl', 12.00, 24, 'Pays-Bas', '{cacao,brun}'),

-- ── LIQUEURS HERBACÉES / FLORALES ───────────────────────────
('Chartreuse Verte', 'Chartreuse', 'Liqueur Herbes', 'liqueur', 70, 'cl', 38.00, 55, 'France', '{herbacé,intense,unique}'),
('Chartreuse Jaune', 'Chartreuse', 'Liqueur Herbes', 'liqueur', 70, 'cl', 35.00, 40, 'France', '{herbacé,doux,miel}'),
('Bénédictine D.O.M.', 'Bénédictine', 'Liqueur Herbes', 'liqueur', 70, 'cl', 30.00, 40, 'France', '{herbacé,épicé,miel}'),
('Galliano L''Autentico', 'Lucas Bols', 'Liqueur Herbes', 'liqueur', 70, 'cl', 28.00, 42.3, 'Italie', '{herbes,vanille,anisé}'),
('Frangelico', 'Campari', 'Liqueur Noisette', 'liqueur', 70, 'cl', 22.00, 20, 'Italie', '{noisette,doux}'),
('Midori', 'Suntory', 'Liqueur Melon', 'liqueur', 70, 'cl', 20.00, 20, 'Japon', '{melon,vert,sucré}'),
('St-Germain', 'Bacardí', 'Liqueur Sureau', 'liqueur', 70, 'cl', 30.00, 20, 'France', '{sureau,floral,incontournable}'),
('Lychee Bols', 'Bols', 'Liqueur Fruit', 'liqueur', 70, 'cl', 14.00, 17, 'Pays-Bas', '{lychee,floral}'),
('Chambord', 'Brown-Forman', 'Liqueur Framboise', 'liqueur', 70, 'cl', 28.00, 16.5, 'France', '{framboise,cassis,royal}'),

-- ── CRÈMES DE ───────────────────────────────────────────────
('Crème de Cassis Dijon', 'Védrenne', 'Crème', 'liqueur', 70, 'cl', 12.00, 15, 'France', '{cassis,bourgogne}'),
('Crème de Mûre Bols', 'Bols', 'Crème', 'liqueur', 70, 'cl', 12.00, 18, 'Pays-Bas', '{mûre,fruits rouges}'),
('Crème de Menthe Verte', 'Bols', 'Crème', 'liqueur', 70, 'cl', 12.00, 24, 'Pays-Bas', '{menthe,vert}'),
('Crème de Violette', 'Briottet', 'Crème', 'liqueur', 70, 'cl', 14.00, 16, 'France', '{violette,floral}'),
('Disaronno Amaretto', 'Illva Saronno', 'Amaretto', 'liqueur', 70, 'cl', 22.00, 28, 'Italie', '{amande,doux}'),

-- ── AMERS / APERITIFS ───────────────────────────────────────
('Campari', 'Campari', 'Amer', 'liqueur', 70, 'cl', 20.00, 25, 'Italie', '{amer,agrumes,rouge,negroni}'),
('Aperol', 'Campari', 'Aperitif', 'liqueur', 70, 'cl', 16.00, 11, 'Italie', '{orange,doux,spritz}'),
('Cynar', 'Campari', 'Amer', 'liqueur', 70, 'cl', 16.00, 16.5, 'Italie', '{artichaut,amer,végétal}'),
('Select Aperitivo', 'Bigallet', 'Aperitif', 'liqueur', 70, 'cl', 22.00, 17.5, 'Italie', '{amer,venise,spritzy}'),
('Fernet-Branca', 'Fratelli Branca', 'Digestif Amer', 'liqueur', 70, 'cl', 22.00, 39, 'Italie', '{amer,menthe,intense}'),
('Branca Menta', 'Fratelli Branca', 'Digestif Amer', 'liqueur', 70, 'cl', 22.00, 28, 'Italie', '{menthe,amer}'),
('Suze', 'Pernod Ricard', 'Amer', 'liqueur', 70, 'cl', 20.00, 15, 'France', '{gentiane,amer,français}'),
('Italicus', 'Italicus', 'Aperitif', 'liqueur', 70, 'cl', 38.00, 20, 'Italie', '{bergamote,floral,premium}'),
('Malibu', 'Pernod Ricard', 'Liqueur Coco', 'liqueur', 70, 'cl', 14.00, 21, 'Barbade', '{coco,rhum,sucré}'),

-- ── VERMOUTH & AROMATISÉS ───────────────────────────────────
('Noilly Prat Dry', 'Bacardí', 'Vermouth', 'wine', 75, 'cl', 9.00, 18, 'France', '{dry,classique,martini}'),
('Noilly Prat Rouge', 'Bacardí', 'Vermouth', 'wine', 75, 'cl', 9.00, 16, 'France', '{rouge,doux}'),
('Martini Extra Dry', 'Bacardí', 'Vermouth', 'wine', 75, 'cl', 8.00, 15, 'Italie', '{dry,léger}'),
('Martini Rosso', 'Bacardí', 'Vermouth', 'wine', 75, 'cl', 8.00, 15, 'Italie', '{rouge,herbes}'),
('Martini Bianco', 'Bacardí', 'Vermouth', 'wine', 75, 'cl', 8.00, 15, 'Italie', '{blanc,floral}'),
('Carpano Antica Formula', 'Campari', 'Vermouth', 'wine', 100, 'cl', 32.00, 16.5, 'Italie', '{rouge,vanille,premium,negroni}'),
('Punt e Mes', 'Campari', 'Vermouth', 'wine', 100, 'cl', 22.00, 16, 'Italie', '{rouge,amer,complexe}'),
('Lillet Blanc', 'Pernod Ricard', 'Aperitif Vin', 'wine', 75, 'cl', 15.00, 17, 'France', '{bordeaux,agrumes,léger}'),
('Lillet Rosé', 'Pernod Ricard', 'Aperitif Vin', 'wine', 75, 'cl', 15.00, 17, 'France', '{rosé,fruité}'),
('Dolin Dry', 'Dolin', 'Vermouth', 'wine', 75, 'cl', 12.00, 17.5, 'France', '{dry,savoie,délicat}'),
('Dolin Rouge', 'Dolin', 'Vermouth', 'wine', 75, 'cl', 12.00, 16, 'France', '{rouge,savoie}'),

-- ── AMERS BITTERS (format flacon) ───────────────────────────
('Angostura Bitters', 'House of Angostura', 'Bitters', 'other', 20, 'cl', 14.00, 44.7, 'Trinité-et-Tobago', '{incontournable,épicé,aromatic}'),
('Peychaud''s Bitters', 'Sazerac', 'Bitters', 'other', 14.8, 'cl', 15.00, 35, 'États-Unis', '{anisé,léger,sazerac}'),
('Angostura Orange Bitters', 'House of Angostura', 'Bitters', 'other', 10, 'cl', 12.00, 28, 'Trinité-et-Tobago', '{orange,moderne}'),
('Regan''s Orange Bitters No.6', 'Sazerac', 'Bitters', 'other', 14.8, 'cl', 16.00, 45, 'États-Unis', '{orange,sec,bartenders}'),
('Fee Brothers Grapefruit', 'Fee Brothers', 'Bitters', 'other', 15, 'cl', 12.00, 1.5, 'États-Unis', '{pamplemousse,moderne}'),
('Bob''s Vanilla Bitters', 'Bob''s Bitters', 'Bitters', 'other', 10, 'cl', 18.00, 40, 'Angleterre', '{vanille,dessert}'),

-- ── SIROPS ──────────────────────────────────────────────────
('Sirop de Sucre de Canne Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 8.00, 0, 'France', '{neutre,indispensable}'),
('Sirop de Grenadine Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 8.00, 0, 'France', '{grenadine,rouge}'),
('Sirop d''Orgeat Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 9.00, 0, 'France', '{amande,tropicaux}'),
('Sirop de Vanille Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 8.00, 0, 'France', '{vanille,doux}'),
('Sirop de Menthe Verte Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 8.00, 0, 'France', '{menthe,frais}'),
('Sirop de Framboise Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 8.00, 0, 'France', '{framboise,fruits rouges}'),
('Sirop de Gingembre Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 9.00, 0, 'France', '{gingembre,épicé}'),
('Sirop de Passion Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 8.00, 0, 'France', '{passion,tropical}'),
('Sirop de Rose Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 9.00, 0, 'France', '{rose,floral}'),
('Sirop Violette Monin', 'Monin', 'Sirop', 'syrup', 70, 'cl', 9.00, 0, 'France', '{violette,floral}'),
('Sirop de Canne Routin 1883', '1883 Routin', 'Sirop', 'syrup', 100, 'cl', 9.00, 0, 'France', '{canne,naturel}'),
('Sirop de Grenadine Routin 1883', '1883 Routin', 'Sirop', 'syrup', 100, 'cl', 9.00, 0, 'France', '{grenadine,naturel}'),
('Simple Syrup (fait maison 1:1)', null, 'Sirop', 'syrup', 50, 'cl', 0.50, 0, 'Maison', '{sucre,eau,DIY}'),
('Miel (dilué 1:1)', null, 'Sirop', 'syrup', 50, 'cl', 3.00, 0, 'Maison', '{miel,doux,naturel}'),

-- ── JUS ─────────────────────────────────────────────────────
('Jus de Citron Frais', null, 'Agrume', 'juice', 100, 'cl', 2.50, 0, 'France', '{frais,incontournable,acide}'),
('Jus de Lime (Citron Vert) Frais', null, 'Agrume', 'juice', 100, 'cl', 3.00, 0, 'Mexique', '{frais,tropical,acide}'),
('Jus d''Ananas', 'Joker', 'Jus Fruit', 'juice', 100, 'cl', 2.50, 0, 'France', '{tropical,sucré}'),
('Jus de Cranberry Ocean Spray', 'Ocean Spray', 'Jus Fruit', 'juice', 100, 'cl', 3.00, 0, 'États-Unis', '{acidulé,rouge}'),
('Jus de Pamplemousse', 'Joker', 'Agrume', 'juice', 100, 'cl', 3.00, 0, 'France', '{amer,frais}'),
('Jus de Pomme Innocent', 'Innocent', 'Jus Fruit', 'juice', 100, 'cl', 3.00, 0, 'France', '{doux,pomme}'),
('Jus d''Orange Frais', null, 'Agrume', 'juice', 100, 'cl', 2.50, 0, 'Espagne', '{frais,classique}'),

-- ── SOFTS & MIXERS ──────────────────────────────────────────
('Fever-Tree Tonic Water', 'Fever-Tree', 'Tonic', 'other', 20, 'cl', 1.80, 0, 'Angleterre', '{premium,tonic,G&T}'),
('Fever-Tree Mediterranean', 'Fever-Tree', 'Tonic', 'other', 20, 'cl', 1.80, 0, 'Angleterre', '{léger,herbes}'),
('Fever-Tree Ginger Beer', 'Fever-Tree', 'Ginger Beer', 'other', 20, 'cl', 1.80, 0, 'Angleterre', '{gingembre,piquant,mule}'),
('Fever-Tree Ginger Ale', 'Fever-Tree', 'Ginger Ale', 'other', 20, 'cl', 1.80, 0, 'Angleterre', '{gingembre,doux}'),
('Coca-Cola', 'Coca-Cola', 'Soda', 'other', 33, 'cl', 1.20, 0, 'États-Unis', '{classique,highball}'),
('San Pellegrino Naturelle', 'Nestlé', 'Eau Gazeuse', 'other', 75, 'cl', 2.00, 0, 'Italie', '{eau,pétillante}'),
('Schweppes Indian Tonic', 'Schweppes', 'Tonic', 'other', 20, 'cl', 0.90, 0, 'Belgique', '{tonic,accessible}'),

-- ── PRODUITS FRAIS ──────────────────────────────────────────
('Citron Jaune', null, 'Frais', 'fresh', 100, 'g', 1.50, 0, 'Espagne', '{acide,zeste,rondelle}'),
('Citron Vert (Lime)', null, 'Frais', 'fresh', 100, 'g', 2.00, 0, 'Mexique', '{tropical,acide}'),
('Orange', null, 'Frais', 'fresh', 100, 'g', 1.50, 0, 'Espagne', '{zeste,rondelle}'),
('Pamplemousse Rose', null, 'Frais', 'fresh', 100, 'g', 2.00, 0, 'Espagne', '{amer,frais}'),
('Concombre', null, 'Frais', 'fresh', 100, 'g', 1.00, 0, 'France', '{frais,floral,hendricks}'),
('Menthe Fraîche', null, 'Herbe', 'fresh', 30, 'g', 1.50, 0, 'France', '{mojito,fraîcheur}'),
('Basilic Frais', null, 'Herbe', 'fresh', 20, 'g', 1.50, 0, 'France', '{herbe,aromatique}'),
('Gingembre Frais', null, 'Épice', 'fresh', 100, 'g', 2.00, 0, 'Pérou', '{piquant,chaud}'),
('Blanc d''Œuf', null, 'Protéine', 'fresh', 3, 'cl', 0.30, 0, 'France', '{mousse,texture,sour}'),
('Crème Fraîche Épaisse', null, 'Laitier', 'fresh', 20, 'cl', 1.50, 0, 'France', '{riche,doux}');
