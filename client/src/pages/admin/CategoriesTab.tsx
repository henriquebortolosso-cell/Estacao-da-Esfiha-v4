import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Tag, ArrowUpDown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "./shared";
import type { Product, Category } from "@shared/schema";

function CategoryModal({ category, onClose, onSave }: { category?:Category|null; onClose:()=>void; onSave:(d:{name:string;sortOrder:number})=>void }) {
  const [form, setForm] = useState({ name:category?.name||"", sortOrder:category?.sortOrder?.toString()||"99" });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg">{category?"Editar Categoria":"Nova Categoria"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={e=>{ e.preventDefault(); onSave({ name:form.name, sortOrder:Number(form.sortOrder) }); }} className="p-5 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nome</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: PROMOÇÕES" required data-testid="input-category-name"/></div>
          <div><label className="block text-sm font-medium mb-1">Ordem de exibição</label><input type="number" value={form.sortOrder} onChange={e=>setForm(f=>({...f,sortOrder:e.target.value}))} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" min="1" data-testid="input-category-order"/></div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors" data-testid="button-save-category">{category?"Salvar":"Adicionar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoriesTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [modal, setModal] = useState<{ open:boolean; category?:Category|null }>({ open:false });

  const { data:categories=[] } = useQuery<Category[]>({ queryKey:["/api/categories"],     queryFn:()=>api("/api/categories") });
  const { data:products=[]   } = useQuery<Product[]> ({ queryKey:["/api/admin/products"], queryFn:()=>api("/api/admin/products") });

  const createCategory = useMutation({ mutationFn:(d:{name:string;sortOrder:number})=>api("/api/admin/categories","POST",d), onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/categories"]}); setModal({open:false}); toast({title:"Categoria adicionada!"}); }, onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}) });
  const updateCategory = useMutation({ mutationFn:({id,data}:{id:number;data:Partial<Category>})=>api(`/api/admin/categories/${id}`,"PUT",data), onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/categories"]}); setModal({open:false}); toast({title:"Categoria atualizada!"}); }, onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}) });
  const deleteCategory = useMutation({ mutationFn:(id:number)=>api(`/api/admin/categories/${id}`,"DELETE"), onSuccess:()=>{ qc.invalidateQueries({queryKey:["/api/categories"]}); toast({title:"Categoria removida!"}); }, onError:(e:Error)=>toast({title:"Erro",description:e.message,variant:"destructive"}) });

  const handleSave = (d:{name:string;sortOrder:number}) => {
    if (modal.category) updateCategory.mutate({ id:modal.category.id, data:d });
    else createCategory.mutate(d);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Categorias</h1><p className="text-gray-400 text-sm mt-0.5">{categories.length} categoria{categories.length!==1?"s":""}</p></div>
        <button onClick={()=>setModal({open:true,category:null})} data-testid="button-add-category" className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold"><Plus className="w-4 h-4"/>Nova categoria</button>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {categories.length===0
          ? <div className="p-12 text-center"><Tag className="w-8 h-8 text-gray-600 mx-auto mb-2"/><p className="text-gray-400 text-sm">Nenhuma categoria</p></div>
          : (
            <div className="divide-y divide-gray-800">
              {categories.map(cat => {
                const count = products.filter(p=>p.categoryId===cat.id).length;
                return (
                  <div key={cat.id} data-testid={`row-category-${cat.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/50 transition-colors">
                    <ArrowUpDown className="w-4 h-4 text-gray-600 shrink-0"/>
                    <div className="flex-1 min-w-0"><p className="text-white text-sm font-semibold">{cat.name}</p><p className="text-gray-500 text-xs">{count} produto{count!==1?"s":""} · ordem {cat.sortOrder}</p></div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={()=>setModal({open:true,category:cat})} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg" data-testid={`button-edit-category-${cat.id}`}><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>{ if(confirm(`Remover "${cat.name}"?`))deleteCategory.mutate(cat.id); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg" data-testid={`button-delete-category-${cat.id}`}><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
      {modal.open && <CategoryModal category={modal.category} onClose={()=>setModal({open:false})} onSave={handleSave}/>}
    </div>
  );
}
