
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  LayoutGrid, 
  MapPin, 
  Plus, 
  Search, 
  TrendingUp, 
  AlertTriangle,
  History,
  BrainCircuit,
  X,
  Trash2,
  Edit2,
  Settings,
  Filter,
  ArrowUpDown,
  Smile,
  ArrowRightLeft,
  ListPlus,
  ShoppingCart,
  MinusCircle
} from 'lucide-react';
import { InventoryState, Product, Category, Location, Transaction, TransactionType } from './types';
import { analyzeInventory } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'transactions' | 'config'>('dashboard');
  const [state, setState] = useState<InventoryState>(() => {
    const defaultState: InventoryState = {
      products: [],
      categories: [
        { id: '1', name: 'Eletrônicos', color: 'bg-red-500', emoji: '🔥' },
        { id: '2', name: 'Alimentos', color: 'bg-green-500', emoji: '🍎' },
        { id: '3', name: 'Escritório', color: 'bg-purple-500', emoji: '🖇️' }
      ],
      locations: [
        { id: '1', name: 'Almoxarifado A' },
        { id: '2', name: 'Prateleira B2' }
      ],
      transactions: []
    };

    const saved = localStorage.getItem('inventory_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          products: parsed.products || [],
          transactions: parsed.transactions || [],
          categories: parsed.categories || defaultState.categories,
          locations: parsed.locations || defaultState.locations,
        };
      } catch (e) {
        console.error("Erro ao carregar cache:", e);
        return defaultState;
      }
    }
    return defaultState;
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);

  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [isDeleteLocationModalOpen, setIsDeleteLocationModalOpen] = useState(false);

  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBulkOutputModalOpen, setIsBulkOutputModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.IN);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'name_desc' | 'price_asc' | 'price_desc'>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLowStock, setFilterLowStock] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('inventory_state', JSON.stringify(state));
  }, [state]);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setState(prevState => {
      const newProducts = prevState.products.filter(p => p.id !== id);
      const newTransactions = prevState.transactions.filter(t => t.productId !== id);
      return {
        ...prevState,
        products: newProducts,
        transactions: newTransactions
      };
    });
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductToDeleteId(null);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'lastUpdated'>) => {
    const now = new Date().toISOString();
    const productId = editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9);
    
    setState(prev => {
      let newTransactions = [...prev.transactions];
      let newProducts = [...prev.products];

      if (editingProduct) {
        const qtyDiff = productData.quantity - editingProduct.quantity;
        if (qtyDiff !== 0) {
          newTransactions.unshift({
            id: Math.random().toString(36).substr(2, 9),
            productId: productId,
            type: qtyDiff > 0 ? TransactionType.IN : TransactionType.OUT,
            quantity: Math.abs(qtyDiff),
            date: now,
            reason: 'Ajuste manual no cadastro',
            unitPrice: productData.costPrice
          });
        }
        newProducts = newProducts.map(p => p.id === productId ? { ...p, ...productData, lastUpdated: now } : p);
      } else {
        if (productData.quantity > 0) {
          newTransactions.unshift({
            id: Math.random().toString(36).substr(2, 9),
            productId: productId,
            type: TransactionType.IN,
            quantity: productData.quantity,
            date: now,
            reason: 'Estoque inicial',
            unitPrice: productData.costPrice
          });
        }
        newProducts.push({
          ...productData,
          id: productId,
          lastUpdated: now
        });
      }

      return {
        ...prev,
        products: newProducts,
        transactions: newTransactions
      };
    });

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveCategory = (catData: Omit<Category, 'id'>) => {
    setState(prev => {
      if (editingCategory) {
        return {
          ...prev,
          categories: prev.categories.map(c => c.id === editingCategory.id ? { ...c, ...catData } : c)
        };
      } else {
        const newCat: Category = { ...catData, id: Math.random().toString(36).substr(2, 9) };
        return { ...prev, categories: [...prev.categories, newCat] };
      }
    });
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveLocation = (locData: Omit<Location, 'id'>) => {
    setState(prev => {
      if (editingLocation) {
        return {
          ...prev,
          locations: prev.locations.map(l => l.id === editingLocation.id ? { ...l, ...locData } : l)
        };
      } else {
        const newLoc: Location = { ...locData, id: Math.random().toString(36).substr(2, 9) };
        return { ...prev, locations: [...prev.locations, newLoc] };
      }
    });
    setIsLocationModalOpen(false);
    setEditingLocation(null);
  };

  const handleRemoveCategoryClick = (e: React.MouseEvent, cat: Category) => {
    e.stopPropagation();
    if (state.categories.length <= 1) {
      alert('Não é possível excluir a última categoria do sistema.');
      return;
    }
    const linkedProducts = state.products.filter(p => p.categoryId === cat.id);
    if (linkedProducts.length > 0) {
      setCategoryToDelete(cat);
      setIsDeleteCategoryModalOpen(true);
    } else {
      if (window.confirm(`Tem certeza que deseja excluir a categoria "${cat.name}"?`)) {
        setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== cat.id) }));
      }
    }
  };

  const handleConfirmCategoryDeletion = (targetCategoryId: string) => {
    if (!categoryToDelete) return;
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== categoryToDelete.id),
      products: prev.products.map(p => p.categoryId === categoryToDelete.id ? { ...p, categoryId: targetCategoryId, lastUpdated: new Date().toISOString() } : p)
    }));
    setIsDeleteCategoryModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleRemoveLocationClick = (e: React.MouseEvent, loc: Location) => {
    e.stopPropagation();
    if (state.locations.length <= 1) {
      alert('Não é possível excluir o último local do sistema.');
      return;
    }
    const linkedProducts = state.products.filter(p => p.locationId === loc.id);
    if (linkedProducts.length > 0) {
      setLocationToDelete(loc);
      setIsDeleteLocationModalOpen(true);
    } else {
      if (window.confirm(`Tem certeza que deseja excluir o local "${loc.name}"?`)) {
        setState(prev => ({ ...prev, locations: prev.locations.filter(l => l.id !== loc.id) }));
      }
    }
  };

  const handleConfirmLocationDeletion = (targetLocationId: string) => {
    if (!locationToDelete) return;
    setState(prev => ({
      ...prev,
      locations: prev.locations.filter(l => l.id !== locationToDelete.id),
      products: prev.products.map(p => p.locationId === locationToDelete.id ? { ...p, locationId: targetLocationId, lastUpdated: new Date().toISOString() } : p)
    }));
    setIsDeleteLocationModalOpen(false);
    setLocationToDelete(null);
  };

  const handleAddTransaction = (data: { productId: string; quantity: number; reason: string; type: TransactionType }) => {
    const product = state.products.find(p => p.id === data.productId);
    if (!product) return;
    if (data.type === TransactionType.OUT && product.quantity < data.quantity) {
      alert('Estoque insuficiente!');
      return;
    }
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      date: new Date().toISOString(),
      reason: data.reason,
      unitPrice: product.costPrice
    };
    setState(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
      products: prev.products.map(p => p.id === data.productId ? { ...p, quantity: p.quantity + (data.type === TransactionType.IN ? data.quantity : -data.quantity), lastUpdated: new Date().toISOString() } : p)
    }));
    setIsTransactionModalOpen(false);
  };

  const handleBulkOutput = (items: { productId: string; quantity: number }[], reason: string) => {
    const now = new Date().toISOString();
    
    setState(prev => {
      const newTransactions = [...prev.transactions];
      const newProducts = [...prev.products];

      items.forEach(item => {
        const product = newProducts.find(p => p.id === item.productId);
        if (product) {
          // Gerar Transação
          newTransactions.unshift({
            id: Math.random().toString(36).substr(2, 9),
            productId: item.productId,
            type: TransactionType.OUT,
            quantity: item.quantity,
            date: now,
            reason: reason || 'Múltiplas Saídas',
            unitPrice: product.costPrice
          });

          // Atualizar Produto
          const pIdx = newProducts.findIndex(p => p.id === item.productId);
          newProducts[pIdx] = {
            ...product,
            quantity: product.quantity - item.quantity,
            lastUpdated: now
          };
        }
      });

      return {
        ...prev,
        transactions: newTransactions,
        products: newProducts
      };
    });

    setIsBulkOutputModalOpen(false);
  };

  const handleAiAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeInventory(state);
    setAiAnalysis(result || "Erro ao processar análise.");
    setIsAnalyzing(false);
  };

  const filteredProducts = useMemo(() => {
    let result = state.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterCategory !== 'all') result = result.filter(p => p.categoryId === filterCategory);
    if (filterLowStock) result = result.filter(p => p.quantity <= (p.minStock || 0));
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'price_asc': return a.costPrice - b.costPrice;
        case 'price_desc': return b.costPrice - a.costPrice;
        default: return 0;
      }
    });
    return result;
  }, [state.products, searchTerm, filterCategory, sortBy, filterLowStock]);

  const totalStockValue = useMemo(() => state.products.reduce((acc, p) => acc + (p.quantity * p.costPrice), 0), [state.products]);
  const lowStockCount = useMemo(() => state.products.filter(p => p.quantity <= (p.minStock || 0)).length, [state.products]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-inter">
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg"><Package className="w-6 h-6" /></div>
          <h1 className="text-xl font-bold tracking-tight">GestorPro</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutGrid size={20}/>} label="Dashboard" />
          <NavItem active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={20}/>} label="Estoque" />
          <NavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History size={20}/>} label="Histórico" />
          <NavItem active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={<Settings size={20}/>} label="Configurações" />
        </nav>
        <div className="p-4 bg-slate-800/50 m-4 rounded-xl">
          <button onClick={handleAiAnalyze} disabled={isAnalyzing} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-sm font-medium transition-all shadow-lg disabled:opacity-50">
            <BrainCircuit size={18} className={isAnalyzing ? 'animate-pulse' : ''} />
            {isAnalyzing ? 'Analisando...' : 'Análise IA'}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
          <div className="flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-full max-w-md">
            <Search className="text-slate-400 mr-2" size={18} />
            <input type="text" placeholder="Buscar em estoque..." className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-4">
            <button 
              onClick={() => setIsBulkOutputModalOpen(true)} 
              className="hidden sm:flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-200 whitespace-nowrap"
            >
              <ArrowUpRight size={18} /> Múltiplas Saídas
            </button>
            <button 
              onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap"
            >
              <Plus size={18} /> <span className="hidden sm:inline">Novo Produto</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
          {aiAnalysis && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2"><button onClick={() => setAiAnalysis(null)} className="text-indigo-400 hover:text-indigo-600"><X size={20} /></button></div>
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm"><BrainCircuit className="text-indigo-600" size={24} /></div>
                <div className="flex-1"><h3 className="text-indigo-900 font-bold text-lg mb-2">Relatório Estratégico IA</h3><div className="text-indigo-800 text-sm whitespace-pre-line leading-relaxed">{aiAnalysis}</div></div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard title="Valor Total" value={`R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<TrendingUp className="text-blue-600"/>} color="bg-blue-50" />
              <StatCard title="Total Itens" value={state.products.reduce((a,b) => a + b.quantity, 0).toString()} icon={<Package className="text-emerald-600"/>} color="bg-emerald-50" />
              <StatCard title="Estoque Baixo" value={lowStockCount.toString()} icon={<AlertTriangle className="text-amber-600"/>} color="bg-amber-50" onClick={() => { setActiveTab('products'); setFilterLowStock(true); }} />
              <StatCard title="Transações Hoje" value={state.transactions.filter(t => t.date.startsWith(new Date().toISOString().split('T')[0])).length.toString()} icon={<History className="text-purple-600"/>} color="bg-purple-50" />
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2"><Filter size={16} className="text-slate-400" /><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all"><option value="all">Todas as Categorias</option>{state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="flex items-center gap-2"><ArrowUpDown size={16} className="text-slate-400" /><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all"><option value="name">Ordem A-Z</option><option value="name_desc">Ordem Z-A</option><option value="price_asc">Preço: Menor</option><option value="price_desc">Preço: Maior</option></select></div>
                  </div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">Total em Estoque: <span className="text-blue-600 font-bold">R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                </div>
                
                {(filterLowStock || filterCategory !== 'all') && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-tight">
                      <Filter size={16} />
                      Filtros ativos: {filterLowStock ? 'Estoque Baixo' : ''} {filterCategory !== 'all' ? `• Categoria: ${state.categories.find(c => c.id === filterCategory)?.name}` : ''}
                    </div>
                    <button 
                      onClick={() => { setFilterLowStock(false); setFilterCategory('all'); }} 
                      className="text-blue-800 hover:text-blue-900 font-black text-[10px] uppercase underline underline-offset-4 flex items-center gap-1"
                    >
                      <X size={14} /> LIMPAR TUDO
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h2 className="font-bold text-slate-800">Catálogo de Produtos</h2><span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{filteredProducts.length} itens encontrados</span></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                      <tr><th className="px-6 py-4">Produto</th><th className="px-6 py-4 hidden sm:table-cell">Categoria</th><th className="px-6 py-4">Estoque / Mín</th><th className="px-6 py-4">Valor Unit.</th><th className="px-6 py-4 text-right">Ações</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium">Nenhum produto encontrado com os filtros atuais</td></tr>
                      ) : filteredProducts.map(product => {
                        const isLowStock = product.quantity <= (product.minStock || 0);
                        const cat = state.categories.find(c => c.id === product.categoryId);
                        const loc = state.locations.find(l => l.id === product.locationId);
                        return (
                          <tr key={product.id} onClick={() => handleEditClick(product)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                            <td className="px-6 py-4"><div className="font-bold text-slate-900 truncate">{product.name}</div><div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium"><MapPin size={10} /> {loc?.name || 'Sem Local'}</div></td>
                            <td className="px-6 py-4 hidden sm:table-cell"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white whitespace-nowrap ${cat?.color || 'bg-slate-400'}`}>{cat?.emoji} {cat?.name || 'Geral'}</span></td>
                            <td className="px-6 py-4"><div className={`flex items-center gap-1.5 font-bold text-xs md:text-sm whitespace-nowrap ${isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>{product.quantity} / {product.minStock || 0}{isLowStock && <AlertTriangle size={14} className="flex-shrink-0" />}</div></td>
                            <td className="px-6 py-4 text-slate-600 font-mono text-xs md:text-sm whitespace-nowrap font-medium">R$ {product.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEditClick(product); }} 
                                  className="p-3 text-blue-500 hover:bg-blue-50 rounded-lg transition-all active:scale-95" 
                                  title="Editar"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setProductToDeleteId(product.id); }} 
                                  className="p-3 text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-95" 
                                  title="Excluir"
                                >
                                  <Trash2 size={18} className="pointer-events-none" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2"><h2 className="font-bold text-slate-800 text-lg">Histórico de Transações</h2><span className="text-xs text-slate-500 font-bold uppercase tracking-tight">{state.transactions.length} registros</span></div>
              {state.transactions.map(transaction => {
                const product = state.products.find(p => p.id === transaction.productId);
                return (
                  <div key={transaction.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <div className={`p-2.5 rounded-full shrink-0 ${transaction.type === TransactionType.IN ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{transaction.type === TransactionType.IN ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2"><h4 className="font-bold text-slate-900 truncate">{product?.name || 'Produto Excluído'}</h4><span className="text-[10px] text-slate-400 font-bold whitespace-nowrap uppercase">{new Date(transaction.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span></div>
                      <p className="text-xs text-slate-500 italic truncate font-medium">"{transaction.reason || 'Sem motivo informado'}"</p>
                    </div>
                    <div className="text-right shrink-0"><div className={`text-base font-bold ${transaction.type === TransactionType.IN ? 'text-emerald-600' : 'text-rose-600'}`}>{transaction.type === TransactionType.IN ? '+' : '-'}{transaction.quantity}</div><div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">UN</div></div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'config' && (
             <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div><h3 className="font-bold text-lg text-slate-800">Categorias</h3><p className="text-xs text-slate-400 font-medium">Gerencie agrupamentos de produtos</p></div>
                    <button onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }} className="text-blue-600 text-sm font-black uppercase tracking-tight flex items-center gap-1 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"><Plus size={16} /> NOVA</button>
                  </div>
                  <div className="space-y-4">
                    {state.categories.map(cat => (
                      <div key={cat.id} className="p-2 bg-slate-100/50 rounded-2xl border border-slate-100 shadow-sm transition-all">
                        <div className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${cat.color}`}></div>
                          <div className="text-xl shrink-0">{cat.emoji || '📦'}</div>
                          <span className="flex-1 font-bold text-slate-800">{cat.name}</span>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setIsCategoryModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                            <button onClick={(e) => handleRemoveCategoryClick(e, cat)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div><h3 className="font-bold text-lg text-slate-800">Locais de Armazenamento</h3><p className="text-xs text-slate-400 font-medium">Prateleiras, corredores ou unidades</p></div>
                    <button onClick={() => { setEditingLocation(null); setIsLocationModalOpen(true); }} className="text-blue-600 text-sm font-black uppercase tracking-tight flex items-center gap-1 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"><Plus size={16} /> NOVO</button>
                  </div>
                  <div className="space-y-3">
                    {state.locations.map(loc => (
                      <div key={loc.id} className="p-2 bg-slate-100/50 rounded-2xl border border-slate-100 shadow-sm group">
                         <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-50">
                          <MapPin className="text-slate-400 shrink-0" size={18} />
                          <span className="flex-1 font-bold text-slate-800">{loc.name}</span>
                          <div className="flex gap-1">
                             <button onClick={(e) => { e.stopPropagation(); setEditingLocation(loc); setIsLocationModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                             <button onClick={(e) => handleRemoveLocationClick(e, loc)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          )}
        </div>

        <div className="md:hidden fixed bottom-6 left-4 right-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex justify-around items-center p-3 z-30 border border-slate-800/50 backdrop-blur-md">
          <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutGrid size={22}/>} label="Início" />
          <MobileNavItem active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={22}/>} label="Estoque" />
          <div className="relative">
            <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center -mt-10 border-4 border-slate-900 shadow-lg active:scale-95 transition-transform cursor-pointer" onClick={() => setIsActionMenuOpen(true)}>
              <Plus size={24} className="text-white" />
            </button>
          </div>
          <MobileNavItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History size={22}/>} label="Histórico" />
          <MobileNavItem active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={<Settings size={22}/>} label="Ajustes" />
        </div>

        {isActionMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex items-end justify-center px-4 pb-28">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsActionMenuOpen(false)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ações Rápidas</h3>
                <button onClick={() => setIsActionMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => { setIsActionMenuOpen(false); setEditingProduct(null); setIsProductModalOpen(true); }} 
                  className="flex items-center gap-4 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 active:scale-95 transition-all"
                >
                  <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm"><Package size={20} /></div>
                  <span className="font-bold">Novo Produto</span>
                </button>
                <button 
                  onClick={() => { setIsActionMenuOpen(false); setIsBulkOutputModalOpen(true); }} 
                  className="flex items-center gap-4 p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100 active:scale-95 transition-all"
                >
                  <div className="p-2 bg-orange-600 text-white rounded-lg shadow-sm"><ArrowUpRight size={20} /></div>
                  <span className="font-bold">Múltiplas Saídas</span>
                </button>
                <button 
                  onClick={() => { setIsActionMenuOpen(false); setTransactionType(TransactionType.IN); setIsTransactionModalOpen(true); }} 
                  className="flex items-center gap-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 active:scale-95 transition-all"
                >
                  <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm"><ArrowDownLeft size={20} /></div>
                  <span className="font-bold">Registrar Entrada</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Confirmação de Exclusão de Produto */}
      {productToDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 bg-rose-600 border-b border-rose-700 flex justify-between items-center text-white shrink-0">
              <h3 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                <Trash2 size={24} /> Confirmar Exclusão
              </h3>
              <button onClick={() => setProductToDeleteId(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 text-slate-700 font-medium text-center space-y-2">
              <p className="text-lg">Deseja excluir permanentemente este produto?</p>
              <p className="text-sm text-slate-400">Esta ação removerá o item do catálogo e todo o histórico de transações vinculado a ele.</p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                onClick={() => setProductToDeleteId(null)} 
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 uppercase tracking-tighter hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteProduct(productToDeleteId)} 
                className="flex-1 py-4 bg-rose-600 rounded-2xl font-black text-white hover:bg-rose-700 shadow-lg uppercase tracking-tighter transition-all active:scale-95"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isProductModalOpen && (
        <ProductModal 
          categories={state.categories} 
          locations={state.locations} 
          product={editingProduct} 
          onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }} 
          onSave={handleSaveProduct} 
          onDelete={(id) => setProductToDeleteId(id)}
        />
      )}
      
      {isBulkOutputModalOpen && (
        <BulkOutputModal 
          products={state.products}
          onClose={() => setIsBulkOutputModalOpen(false)}
          onSave={handleBulkOutput}
        />
      )}

      {isTransactionModalOpen && <TransactionModal products={state.products} type={transactionType} onClose={() => setIsTransactionModalOpen(false)} onSave={handleAddTransaction} />}
      {isCategoryModalOpen && <CategoryModal category={editingCategory} onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} onSave={handleSaveCategory} />}
      {isLocationModalOpen && <LocationModal location={editingLocation} onClose={() => { setIsLocationModalOpen(false); setEditingLocation(null); }} onSave={handleSaveLocation} />}
      {isDeleteCategoryModalOpen && categoryToDelete && (
        <RelocationModal 
          title="Remanejamento de Categoria"
          item={categoryToDelete} 
          options={state.categories.filter(c => c.id !== categoryToDelete.id)} 
          type="category"
          onClose={() => { setIsDeleteCategoryModalOpen(false); setCategoryToDelete(null); }} 
          onConfirm={handleConfirmCategoryDeletion} 
        />
      )}
      {isDeleteLocationModalOpen && locationToDelete && (
        <RelocationModal 
          title="Remanejamento de Local"
          item={locationToDelete} 
          options={state.locations.filter(l => l.id !== locationToDelete.id)} 
          type="location"
          onClose={() => { setIsDeleteLocationModalOpen(false); setLocationToDelete(null); }} 
          onConfirm={handleConfirmLocationDeletion} 
        />
      )}
    </div>
  );
};

// Componentes Auxiliares
const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'}`}>{icon}{label}</button>
);

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-400' : 'text-slate-400'}`}>{icon}<span className="text-[9px] font-black tracking-tight uppercase">{label}</span></button>
);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; onClick?: () => void }> = ({ title, value, icon, color, onClick }) => (
  <div onClick={onClick} className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}><div className="flex justify-between items-start mb-3"><div className={`p-2 rounded-xl ${color}`}>{icon}</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div></div><div className="text-xl md:text-2xl font-black text-slate-900 truncate">{value}</div></div>
);

const CategoryModal: React.FC<{ category: Category | null; onClose: () => void; onSave: (d: any) => void }> = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || 'bg-blue-500',
    emoji: category?.emoji || '📦'
  });
  const colors = [
    { name: 'Azul', value: 'bg-blue-500' }, { name: 'Verde', value: 'bg-green-500' }, { name: 'Roxo', value: 'bg-purple-500' }, { name: 'Rosa', value: 'bg-rose-500' },
    { name: 'Laranja', value: 'bg-amber-500' }, { name: 'Esmeralda', value: 'bg-emerald-500' }, { name: 'Vermelho', value: 'bg-red-500' }, { name: 'Indigo', value: 'bg-indigo-500' }
  ];
  const emojis = ['📦', '💻', '🍎', '🖇️', '👕', '💊', '🛠️', '⚽', '🚗', '🧴', '🔋', '🏠', '✨', '🔥'];
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-black text-slate-900">{category ? 'Editar Categoria' : 'Nova Categoria'}</h3><button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full"><X size={24} /></button></div>
        <div className="p-6 space-y-6">
          <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none border font-bold text-slate-800" /></div>
          <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Emoji</label><div className="flex flex-wrap gap-2">{emojis.map(e => <button key={e} onClick={() => setFormData({...formData, emoji: e})} className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all ${formData.emoji === e ? 'bg-blue-100 ring-2 ring-blue-500 scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}>{e}</button>)}</div></div>
          <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Cor</label><div className="flex flex-wrap gap-3">{colors.map(c => <button key={c.value} onClick={() => setFormData({...formData, color: c.value})} className={`w-8 h-8 rounded-full ${c.value} transition-all ${formData.color === c.value ? 'ring-4 ring-offset-2 ring-blue-500 scale-110' : ''}`} />)}</div></div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3"><button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 uppercase tracking-tighter">Cancelar</button><button onClick={() => onSave(formData)} disabled={!formData.name} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black text-white hover:bg-blue-700 shadow-lg uppercase tracking-tighter">Salvar</button></div>
      </div>
    </div>
  );
};

const LocationModal: React.FC<{ location: Location | null; onClose: () => void; onSave: (d: any) => void }> = ({ location, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
  });
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900">{location ? 'Editar Local' : 'Novo Local'}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome do Local</label>
            <input 
              type="text" 
              placeholder="Ex: Corredor A, Prateleira 4"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none border font-bold text-slate-800" 
            />
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 uppercase tracking-tighter">Cancelar</button>
          <button onClick={() => onSave(formData)} disabled={!formData.name} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black text-white hover:bg-blue-700 shadow-lg uppercase tracking-tighter">Salvar</button>
        </div>
      </div>
    </div>
  );
};

const RelocationModal: React.FC<{ title: string; item: Category | Location; options: (Category | Location)[]; type: 'category' | 'location'; onClose: () => void; onConfirm: (targetId: string) => void }> = ({ title, item, options, type, onClose, onConfirm }) => {
  const [targetId, setTargetId] = useState(options[0]?.id || '');
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 bg-rose-600 border-b border-rose-700 flex justify-between items-center"><h3 className="text-xl font-black text-white flex items-center gap-2"><Trash2 size={24} /> {title}</h3><button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button></div>
        <div className="p-6 space-y-6 text-center">
          <p className="text-slate-600 font-medium">O {type === 'category' ? 'item' : 'local'} <span className="font-bold text-slate-900">"{item.name}"</span> possui produtos vinculados.</p>
          <p className="text-sm text-slate-500 mt-2">Escolha um novo destino para estes produtos:</p>
          <div className="space-y-2 text-left mt-4"><label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ArrowRightLeft size={14} /> Mover para:</label><select className="w-full border-slate-200 rounded-2xl p-4 outline-none border bg-white font-bold text-slate-800" value={targetId} onChange={e => setTargetId(e.target.value)}>{options.map(opt => <option key={opt.id} value={opt.id}>{'emoji' in opt ? `${opt.emoji} ${opt.name}` : opt.name}</option>)}</select></div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3"><button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 uppercase tracking-tighter">Cancelar</button><button onClick={() => onConfirm(targetId)} className="flex-1 py-4 bg-rose-600 rounded-2xl font-black text-white hover:bg-rose-700 shadow-lg uppercase tracking-tighter">Mover e Excluir</button></div>
      </div>
    </div>
  );
};

const ProductModal: React.FC<{ categories: Category[]; locations: Location[]; product: Product | null; onClose: () => void; onSave: (p: any) => void; onDelete: (id: string) => void }> = ({ categories, locations, product, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    quantity: product?.quantity || 0,
    minStock: product?.minStock || 0,
    categoryId: product?.categoryId || (categories.length > 0 ? categories[0].id : ''),
    costPrice: product?.costPrice || 0,
    locationId: product?.locationId || (locations.length > 0 ? locations[0].id : ''),
    expirationDate: product?.expirationDate || new Date().toISOString().split('T')[0]
  });
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0"><h3 className="text-xl font-black text-slate-900">{product ? 'Editar Produto' : 'Cadastrar Produto'}</h3><button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full"><X size={24} /></button></div>
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome do Produto</label><input type="text" placeholder="Ex: Teclado Mecânico RGB" className="w-full border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none border font-bold text-slate-800" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Estoque Atual</label><input type="number" className="w-full border-slate-200 rounded-2xl p-4 outline-none border font-bold text-slate-800" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Estoque Mínimo</label><input type="number" className="w-full border-slate-200 rounded-2xl p-4 outline-none border font-bold text-slate-800" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Custo Unitário (R$)</label><input type="number" step="0.01" className="w-full border-slate-200 rounded-2xl p-4 outline-none border font-bold text-slate-800" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Categoria</label><select className="w-full border-slate-200 rounded-2xl p-4 outline-none border text-sm font-bold text-slate-800 bg-white" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select></div>
          </div>
          <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Localização</label><select className="w-full border-slate-200 rounded-2xl p-4 outline-none border text-sm font-bold text-slate-800 bg-white" value={formData.locationId} onChange={e => setFormData({ ...formData, locationId: e.target.value })}>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          {product && (
            <button 
              type="button"
              onClick={() => onDelete(product.id)} 
              className="p-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-colors active:scale-95" 
              title="Excluir Produto Permanentemente"
            >
              <Trash2 size={24} />
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 uppercase tracking-tighter">Cancelar</button>
          <button onClick={() => onSave(formData)} disabled={!formData.name} className="flex-1 py-4 bg-blue-600 rounded-2xl font-black text-white hover:bg-blue-700 shadow-lg uppercase tracking-tighter disabled:opacity-50 transition-all">
            {product ? 'Salvar Alterações' : 'Concluir Cadastro'}
          </button>
        </div>
      </div>
    </div>
  );
}

const BulkOutputModal: React.FC<{ products: Product[]; onClose: () => void; onSave: (items: any[], reason: string) => void }> = ({ products, onClose, onSave }) => {
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => !selectedItems.find(item => item.productId === p.id))
      .slice(0, 5);
  }, [products, searchTerm, selectedItems]);

  const addItem = (product: Product) => {
    setSelectedItems([...selectedItems, { productId: product.id, quantity: 1 }]);
    setSearchTerm('');
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== id));
  };

  const updateQty = (id: string, qty: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const finalQty = Math.min(product.quantity, Math.max(1, qty));
    setSelectedItems(selectedItems.map(i => i.productId === id ? { ...i, quantity: finalQty } : i));
  };

  const isValid = selectedItems.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="p-6 md:p-8 bg-orange-600 border-b border-orange-700 flex justify-between items-center text-white shrink-0">
          <h3 className="text-xl md:text-2xl font-black flex items-center gap-3 uppercase tracking-tight">
            <ArrowUpRight size={28} /> Múltiplas Saídas
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={28} /></button>
        </div>
        
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">
          {/* Busca de Produtos com Lista Flutuante */}
          <div className="relative group">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Buscar Produtos para Saída</label>
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-3xl px-5 py-4 transition-all focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:bg-white">
              <Search className="text-slate-400 mr-3" size={22} />
              <input 
                type="text" 
                placeholder="Nome do produto..." 
                className="bg-transparent border-none focus:ring-0 w-full outline-none font-bold text-slate-700 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Lista Flutuante (Dropdown) */}
            {searchResults.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-in slide-in-from-top-2 duration-200">
                <div className="bg-slate-50 px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultados da Busca</div>
                {searchResults.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => addItem(p)}
                    className="w-full text-left p-5 hover:bg-orange-50 flex items-center justify-between group/item transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800 group-hover/item:text-orange-700">{p.name}</div>
                      <div className="text-xs text-slate-500 font-medium">Saldo em estoque: {p.quantity} un</div>
                    </div>
                    <div className="bg-orange-100 text-orange-600 p-2 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <Plus size={18} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista de Itens Selecionados (Conferência) */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart size={14} /> Itens na Lista ({selectedItems.length})
            </h4>
            {selectedItems.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2rem] text-center space-y-3 bg-slate-50/50">
                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-300">
                  <ListPlus size={24} />
                </div>
                <p className="text-slate-400 font-bold text-sm">Nenhum item adicionado à lista de saída.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-left-2 duration-200">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">{product?.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Disponível: {product?.quantity}</div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 rounded-2xl p-1.5 shrink-0">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-white rounded-xl transition-all"><MinusCircle size={20} /></button>
                        <input 
                          type="number" 
                          className="w-12 text-center font-black text-slate-900 outline-none border-none bg-transparent"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 0)}
                        />
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-white rounded-xl transition-all"><Plus size={20} /></button>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Observações (Opcional)</label>
            <textarea 
              className="w-full border-slate-200 rounded-3xl p-5 outline-none border min-h-[100px] text-sm resize-none font-bold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition-all" 
              placeholder="Ex: Venda Lote #441, Remessa Filial, etc."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-5 bg-white border border-slate-200 rounded-3xl font-black text-slate-700 uppercase tracking-tight hover:bg-slate-100 transition-colors shadow-sm">Cancelar</button>
          <button 
            onClick={() => onSave(selectedItems, reason)} 
            disabled={!isValid}
            className="flex-1 py-5 bg-orange-600 rounded-3xl font-black text-white hover:bg-orange-700 shadow-xl uppercase tracking-tight disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Finalizar Saídas
          </button>
        </div>
      </div>
    </div>
  );
};

const TransactionModal: React.FC<{ products: Product[]; type: TransactionType; onClose: () => void; onSave: (d: any) => void }> = ({ products, type, onClose, onSave }) => {
  const [formData, setFormData] = useState({ productId: products.length > 0 ? products[0].id : '', quantity: 1, reason: '', type });
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${type === TransactionType.IN ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            {type === TransactionType.IN ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />} 
            {type === TransactionType.IN ? 'Registrar Entrada' : 'Registrar Saída'}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Produto</label><select className="w-full border-slate-200 rounded-2xl p-4 outline-none border bg-white font-bold text-slate-800" value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })}>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Saldo: {p.quantity})</option>)}</select></div>
          <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Quantidade</label><input type="number" min="1" className="w-full border-slate-200 rounded-2xl p-4 outline-none border font-bold text-slate-800" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 0) })} /></div>
          <div className="space-y-1"><label className="text-xs font-black text-slate-500 uppercase tracking-widest">Observação / Motivo</label><textarea className="w-full border-slate-200 rounded-2xl p-4 outline-none border min-h-[100px] text-sm resize-none font-bold text-slate-700" placeholder="Ex: Compra com fornecedor X ou Venda para cliente Y" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} /></div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3"><button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 uppercase tracking-tighter">Voltar</button><button onClick={() => onSave(formData)} disabled={!formData.productId} className={`flex-1 py-4 rounded-2xl font-black text-white shadow-lg uppercase tracking-tighter ${type === TransactionType.IN ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>Confirmar Movimentação</button></div>
      </div>
    </div>
  );
}

export default App;
