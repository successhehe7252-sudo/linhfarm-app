from pathlib import Path
p = Path('/home/ubuntu/linhfarm/client/src/pages/Home.tsx')
s = p.read_text()
head = s.split('function Inventory(', 1)[0]
tail = s.split('function ProductModal(', 1)[1]
component = r'''function Inventory({ products, onAdd, onEdit, onDelete, onMenu, productMenu }: { products: Product[]; onAdd: () => void; onEdit: (product: Product) => void; onDelete: (id: number) => void; onMenu: (id: number | null) => void; productMenu: number | null }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [menuDirection, setMenuDirection] = useState<"up" | "down">("down");
  const filtered = products.filter(p => (category === "Tất cả" || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()));
  const toggleMenu = (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (productMenu === id) return onMenu(null);
    const trigger = event.currentTarget.getBoundingClientRect();
    const menuHeight = 96;
    const bottomSafeArea = 110;
    const spaceBelow = window.innerHeight - trigger.bottom - bottomSafeArea;
    setMenuDirection(spaceBelow < menuHeight ? "up" : "down");
    onMenu(id);
  };
  return <section className="page-section"><div className="section-heading"><div><span className="eyebrow">Danh mục & tồn kho</span><h2>Kho hàng</h2></div><button className="primary-button" onClick={onAdd}><Plus size={17} /> Thêm sản phẩm</button></div><div className="inventory-summary"><div><b>{products.length}</b><span>Tổng mặt hàng</span></div><div><b className="green-text">{products.filter(p => p.status === "Tươi mới").length}</b><span>Đang bán tốt</span></div><div><b className="orange-text">{products.filter(p => p.status === "Cần bán gấp").length}</b><span>Cần bán gấp</span></div><div><b className="red-text">{products.filter(p => p.status === "Hết hàng").length}</b><span>Hết hàng</span></div></div><div className="inventory-toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm trong kho..." /></div><div className="category-tabs inventory-filters">{["Tất cả", "Trái cây", "Rau củ", "Đồ khô"].map(c => <button className={category === c ? "tab-active" : ""} onClick={() => setCategory(c)} key={c}>{c}</button>)}</div></div><div className="inventory-table">{filtered.map(p => <div className="inventory-row" key={p.id}><img src={p.image} /><div className="inventory-name"><strong>{p.name}</strong><span>{p.category} · Giá nhập {formatMoney(p.cost)}</span></div><div className="stock-cell"><b className={p.stock === 0 ? "red-text" : p.stock < 5 ? "orange-text" : ""}>{p.stock} {p.unit}</b><span>tồn kho</span></div><Badge tone={p.status === "Cần bán gấp" ? "orange" : p.status === "Hết hàng" ? "red" : "green"}>{p.status}</Badge><div className="row-actions"><button className="icon-button" aria-label={`Mở menu ${p.name}`} onClick={event => toggleMenu(p.id, event)}><MoreHorizontal size={18} /></button>{productMenu === p.id && <div className={`action-menu action-menu-${menuDirection}`} role="menu"><button role="menuitem" onClick={() => { onEdit(p); onMenu(null); }}><FileText size={14} /> Chỉnh sửa thông tin</button><button role="menuitem" className="danger-action" onClick={() => { onDelete(p.id); onMenu(null); }}><Trash2 size={14} /> Xóa sản phẩm</button></div>}</div></div>)}</div></section>;
}

function ProductModal('''
p.write_text(head + component + tail)
