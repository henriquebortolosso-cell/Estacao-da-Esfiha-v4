import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Pencil, Trash2, Search, Image, ToggleLeft, ToggleRight, X, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "./shared";
import type { Product, Category } from "@shared/schema";

function ProductModal({ product, categories, defaultCategoryId, onClose, onSave }: { product?:Product|null; categories:Category[]; defaultCategoryId?:number|null; onClose:()=>void; onSave:(d:Partial<Product>)=>void }) {
  const [form, setForm] = useState({ name:product?.name||"", description:product?.description||"", price:product?.price||"", imageUrl:product?.imageUrl||"", categoryId:product?.categoryId?.toString()||(defaultCategoryId?defaultCategoryId.toString():""), active:product?.active??true });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="font-bold text-lg">{product?"Editar Produto":"Novo Produto"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={e=>{ e.preventDefault(); onSave({...form, price:form.price, categoryId:form.categoryId?Number(form.categoryId):null, imageUrl:form.imageUrl||null} as any); }} className="p-5 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nome</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: Esfiha de Carne" required data-testid="input-product-name"/></div>
          <div><label className="block text-sm font-medium mb-1">Descrição</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} placeholder="Descreva o produto..." data-testid="input-product-description"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Preço (R$)</label><input type="number" step="0.01" min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0,00" required data-testid="input-product-price"/></div>
            <div><label className="block text-sm font-medium mb-1">Categoria</label><select value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" required data-testid="select-product-category"><option value="">Selecionar...</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL da foto</label>
            <div className="relative"><Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><input value={form.imageUrl} onChange={e=>setForm(f=>({...f,imageUrl:e.target.value}))} className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="https://..." data-testid="input-product-image"/></div>
            {form.imageUrl && <div className="mt-2 w-[140px] aspect-square rounded-lg overflow-hidden border border-border bg-gray-100"><img src={form.imageUrl} alt="preview" className="w-full h-full object-cover"/></div>}
          </div>
          <div className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium">Produto ativo</p><p className="text-xs text-muted-foreground">Aparece no cardápio</p></div>
            <button type="button" onClick={()=>setForm(f=>({...f,active:!f.active}))} data-testid="toggle-product-active">
              {form.active ? <ToggleRight className="w-8 h-8 text-green-500"/> : <ToggleLeft className="w-8 h-8 text-muted-foreground"/>}
            </button>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors" data-testid="button-save-product">{product?"Salvar alterações":"Adicionar produto"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProductsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modal, setModal] = useState<{ open:boolean; product?:Product|null; defaultCategoryId?:number|null }>({ open:false });
  const [search, setSearch] = useState("");

  const { data:products=[]   } = useQuery<Product[]>  ({ queryKey:["/api/admin/products"], queryFn:()=>api("/api/admin/products") });
  const { data:categories=[] } = useQuery<Category[]> ({ queryKey:["/api/categories"],     queryFn:()=>api("/api/categories") });

  const createProduct = useMutation({ mutationFn:(d:Partial<Product>)=>api("/api/admin/products","POST",d), onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/admin/products"]}); qc.invalidateQueries({queryKey:["/api/products"]}); setModal({open:false}); toast({title:"Produto adicionado!"}); }, onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}) });
  const updateProduct = useMutation({ mutationFn:({id,data}:{id:number;data:Partial<Product>})=>api(`/api/admin/products/${id}`,"PUT",data), onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/admin/products"]}); qc.invalidateQueries({queryKey:["/api/products"]}); setModal({open:false}); toast({title:"Produto atualizado!"}); }, onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}) });
  const deleteProduct = useMutation({ mutationFn:(id:number)=>api(`/api/admin/products/${id}`,"DELETE"), onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/admin/products"]}); qc.invalidateQueries({queryKey:["/api/products"]}); toast({title:"Produto removido!"}); }, onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}) });

  const handleSave = (d:Partial<Product>) => {
    if (modal.product) updateProduct.mutate({ id:modal.product.id, data:d });
    else createProduct.mutate(d);
  };

  const filtered = search.trim() ? products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())) : products;
  const ungrouped = filtered.filter(p=>!p.categoryId);
  const grouped   = categories.slice().sort((a,b)=>(a.sortOrder??99)-(b.sortOrder??99)).map(cat=>({ cat, items:filtered.filter(p=>p.categoryId===cat.id) })).filter(g=>g.items.length>0||!search.trim());

  const PRow = ({ product }: { product:Product }) => (
    <div data-testid={`row-product-${product.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-800/40 transition-colors rounded-lg">
      <div className="w-14 h-14 rounded-lg bg-gray-800 overflow-hidden shrink-0 border border-gray-700">
        {product.imageUrl?<img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center"><Image className="w-5 h-5 text-gray-600"/></div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2"><p className="text-white text-sm font-semibold truncate">{product.name}</p>{!product.active&&<span className="px-1.5 py-0.5 bg-red-900/40 text-red-400 text-[10px] font-semibold rounded-md shrink-0">inativo</span>}</div>
        <p className="text-gray-500 text-xs mt-0.5">R$ {Number(product.price).toFixed(2).replace(".",",")}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={()=>setModal({open:true,product})} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg" data-testid={`button-edit-product-${product.id}`}><Pencil className="w-4 h-4"/></button>
        <button onClick={()=>{ if(confirm(`Remover "${product.name}"?`))deleteProduct.mutate(product.id); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg" data-testid={`button-delete-product-${product.id}`}><Trash2 className="w-4 h-4"/></button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Produtos</h1><p className="text-gray-400 text-sm mt-0.5">{products.length} produto{products.length!==1?"s":""}</p></div>
        <button onClick={()=>setModal({open:true,product:null})} data-testid="button-add-product" className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shrink-0">
          <Plus className="w-4 h-4"/><span className="hidden sm:inline">Novo produto</span><span className="sm:hidden">Novo</span>
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30" data-testid="input-product-search"/>
      </div>
      {filtered.length===0 && search.trim()
        ? <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center"><Package className="w-8 h-8 text-gray-600 mx-auto mb-2"/><p className="text-gray-400 text-sm">Nenhum resultado para "{search}"</p></div>
        : (
          <div className="space-y-4">
            {grouped.map(({cat,items})=>(
              <div key={cat.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/50">
                  <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-primary"/><span className="text-white font-bold text-sm">{cat.name}</span><span className="text-gray-500 text-xs">· {items.length} item{items.length!==1?"s":""}</span></div>
                  <button onClick={()=>setModal({open:true,product:null,defaultCategoryId:cat.id})} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold"><Plus className="w-3.5 h-3.5"/>Adicionar</button>
                </div>
                {items.length===0?<p className="text-gray-600 text-xs text-center py-6">Nenhum produto</p>:<div className="divide-y divide-gray-800/50 px-1">{items.map(p=><PRow key={p.id} product={p}/>)}</div>}
              </div>
            ))}
            {ungrouped.length>0 && <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"><div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-800/50"><Package className="w-3.5 h-3.5 text-gray-500"/><span className="text-gray-400 font-bold text-sm">Sem categoria</span></div><div className="divide-y divide-gray-800/50 px-1">{ungrouped.map(p=><PRow key={p.id} product={p}/>)}</div></div>}
          </div>
        )
      }
      {modal.open && <ProductModal product={modal.product} categories={categories} defaultCategoryId={modal.defaultCategoryId} onClose={()=>setModal({open:false})} onSave={handleSave}/>}
    </div>
  );
}
