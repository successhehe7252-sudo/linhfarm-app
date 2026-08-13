# LinhFarm — Design Direction

## Three stylistic approaches

### Theme Name: Vườn Sáng
Very Brief Intro: Giao diện quản trị sáng, giàu khoảng thở, lấy cảm hứng từ nhãn nông sản cao cấp và nắng sớm Đà Lạt. Màu xanh lá được dùng như tín hiệu hành động thay vì phủ toàn bộ màn hình.
Probability: 0.07

### Theme Name: Chợ Nhanh
Very Brief Intro: Một hệ thống POS năng lượng cao với nhịp thao tác nhanh, thẻ sản phẩm rõ ràng và các điểm nhấn màu ấm như tem giá tại chợ nông sản. Tập trung vào tốc độ bán hàng trên màn hình nhỏ.
Probability: 0.04

### Theme Name: Sổ Nông Trại
Very Brief Intro: Phong cách editorial tối giản kết hợp chất liệu giấy, đường kẻ mảnh và màu đất tự nhiên để gợi cảm giác sổ ghi chép nhập hàng thủ công. Phù hợp với báo cáo và quản lý vận hành chi tiết.
Probability: 0.08

## Chosen direction: Vườn Sáng

### Design Movement
Contemporary Swiss editorial meets premium farm-to-table packaging: a clean operational canvas with warm organic accents and disciplined information hierarchy.

### Core Principles
1. Use fresh green only for action, health, and inventory signals; keep the canvas quiet and breathable.
2. Make every tap target generous, obvious, and reversible on mobile.
3. Treat business data like produce labels: concise, scannable, and grounded in clear units.
4. Use asymmetry and a left-aligned editorial rhythm rather than a generic centered dashboard.

### Color Philosophy
LinhFarm’s ownable color is leaf-green `#1E9E68`, representing fresh stock and confident action. Warm rice `#F7F8F2` becomes the main canvas, while deep pine `#16352B` anchors type and navigation. Tomato, apricot, and purple are reserved for meaningfully different operational states, never decoration.

### Layout Paradigm
A responsive application shell: persistent rail on desktop, bottom action bar on mobile, and pages composed as left-anchored editorial sections with a wider primary workspace and a narrower context rail. POS uses a product-first workspace with a floating cart tray on mobile.

### Signature Elements
- A small leaf-notch marker beside section labels and active navigation.
- Soft “paper card” surfaces with subtle warm shadows instead of heavy borders.
- Tiny uppercase metadata labels paired with large, calm numerals for KPIs.

### Interaction Philosophy
Actions should feel like picking a ripe item: immediate, tactile, and clear. Add-to-cart interactions show a short green confirmation pulse; destructive inventory actions require explicit confirmation; filters preserve context and never reset unexpectedly.

### Animation
Use 160–220ms ease-out transitions for tabs, filters, and cart changes. Stagger first-load content by 40ms per group. Use scale 0.97 on button press, opacity/translate only for drawers and toasts, and respect reduced motion preferences.

### Typography System
Display and brand: Fraunces, 600–700, for LinhFarm’s warm editorial voice and KPI numerals. UI and operational copy: Plus Jakarta Sans, 400–700, for clarity at small sizes. H1 28–36px, section heads 18–22px, body 14–15px, metadata 10–11px uppercase with letter spacing.

### Brand Essence
LinhFarm is the calm, fast operating desk for Đà Lạt produce shops that want every basket, kilo, and nhập hàng to stay under control. Personality: fresh, grounded, dependable.

### Brand Voice
Headlines are direct but warm; CTAs are verbs with an operational payoff; microcopy uses Vietnamese units and avoids generic filler.
- “Sáng nay bán gì tươi nhất?”
- “Chốt đơn, in bill, giao vị Đà Lạt.”

### Wordmark & Logo
A compact leaf-and-check symbol: two asymmetrical leaves form an upward check mark, signaling freshness plus completed operations. The wordmark pairs a custom rounded “Linh” silhouette with a tighter “Farm” label; the mark appears independently in the app header and favicon.

### Signature Brand Color
Leaf Green `#1E9E68`.

## Implementation reminder
All edited component and style files should begin with a short comment referencing the Vườn Sáng direction, the leaf-green action color, and the mobile-first editorial rhythm.

## Style Decisions

- LinhFarm leaf-check mark is now visible in the desktop rail and topbar so the app shell is never anonymous.
- The leaf-notch motif is now used for active navigation, eyebrow section labels, and product freshness signals instead of relying only on generic dots.
- Product cards keep warm Đà Lạt photography, while unit and stock metadata remain compact and operational like premium produce labels.
