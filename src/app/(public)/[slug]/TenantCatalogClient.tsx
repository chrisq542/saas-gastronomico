'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product, Category, ProductOptionGroup, ProductOption, SelectedProductOption } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  Plus,
  Minus,
  ShoppingBag,
  Check,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface TenantCatalogClientProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    phone: string;
    rut?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    address?: string | null;
    customDomain?: string | null;
  };
  initialCategories: (Category & { products: Product[] })[];
}

export default function TenantCatalogClient({
  restaurant,
  initialCategories,
}: TenantCatalogClientProps) {
  const { addItem, totalItems, subtotal } = useCart();
  const [categories] = useState<any[]>(initialCategories);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedProductOption[]>([]);
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [itemNote, setItemNote] = useState<string>('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleOpenCustomize = (product: Product) => {
    setSelectedProduct(product);
    setSelectedOptions([]);
    setCustomQuantity(1);
    setItemNote('');
    setValidationError(null);
  };

  const handleQuickAdd = (product: Product) => {
    // Si el producto tiene grupos de opciones, abrir siempre el modal para que elija
    if (product.optionGroups && product.optionGroups.length > 0) {
      handleOpenCustomize(product);
      return;
    }

    addItem(product, 1, '', []);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1200);
  };

  const handleToggleOption = (group: ProductOptionGroup, option: ProductOption) => {
    setValidationError(null);
    const isCurrentlySelected = selectedOptions.some((o) => o.id === option.id);

    if (group.maxSelect === 1) {
      // Selección única (estilo radio button)
      const optionsWithoutGroup = selectedOptions.filter((o) => o.groupId !== group.id);
      if (isCurrentlySelected && !group.isRequired) {
        // Deseleccionar si es opcional
        setSelectedOptions(optionsWithoutGroup);
      } else {
        setSelectedOptions([
          ...optionsWithoutGroup,
          {
            id: option.id,
            groupId: group.id,
            groupName: group.name,
            name: option.name,
            price: Number(option.price) || 0,
          },
        ]);
      }
      return;
    }

    // Selección múltiple (estilo checkbox con límite maxSelect)
    if (isCurrentlySelected) {
      setSelectedOptions((prev) => prev.filter((o) => o.id !== option.id));
    } else {
      const currentInGroup = selectedOptions.filter((o) => o.groupId === group.id);
      if (currentInGroup.length >= group.maxSelect) {
        return; // Límite alcanzado
      }
      setSelectedOptions((prev) => [
        ...prev,
        {
          id: option.id,
          groupId: group.id,
          groupName: group.name,
          name: option.name,
          price: Number(option.price) || 0,
        },
      ]);
    }
  };

  const handleCustomAdd = () => {
    if (!selectedProduct) return;

    // Validar grupos obligatorios
    if (selectedProduct.optionGroups) {
      for (const group of selectedProduct.optionGroups) {
        if (group.isRequired) {
          const selectedInGroup = selectedOptions.filter((o) => o.groupId === group.id);
          const minRequired = group.minSelect || 1;
          if (selectedInGroup.length < minRequired) {
            setValidationError(`Debes seleccionar al menos ${minRequired} opción en "${group.name}".`);
            return;
          }
        }
      }
    }

    addItem(selectedProduct, customQuantity, itemNote, selectedOptions);
    setJustAddedId(selectedProduct.id);
    setSelectedProduct(null);
    setItemNote('');
    setSelectedOptions([]);
    setTimeout(() => setJustAddedId(null), 1500);
  };

  const filteredCategories =
    activeCategoryId === 'all'
      ? categories
      : categories.filter((c) => c.id === activeCategoryId);

  // Cálculo de precio dinámico en modal
  const optionsTotal = selectedOptions.reduce((sum, o) => sum + Number(o.price || 0), 0);
  const singleItemPrice = (selectedProduct ? Number(selectedProduct.price) : 0) + optionsTotal;
  const modalTotalPrice = singleItemPrice * customQuantity;

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Promocional y Banner del Restaurante */}
      <section className="-mx-4 -mt-6 sm:mx-0 sm:mt-4 relative overflow-hidden rounded-none sm:rounded-2xl border-b sm:border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#121215] shadow-none sm:shadow-xs">
        {restaurant.bannerUrl && (
          <div className="relative h-48 sm:h-60 md:h-72 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.bannerUrl}
              alt={`Banner promocional de ${restaurant.name}`}
              className="w-full h-full object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
          </div>
        )}

        <div className={`px-4 pt-4 pb-6 sm:p-7 relative z-10 ${restaurant.bannerUrl ? '-mt-12 sm:-mt-16' : ''}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 shadow-lg flex-shrink-0 ${
                  restaurant.bannerUrl
                    ? 'border-white dark:border-zinc-900 bg-white dark:bg-zinc-950 ring-2 ring-black/10'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
            ) : (
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-bold text-2xl sm:text-3xl shadow-lg flex-shrink-0 ${
                  restaurant.bannerUrl
                    ? 'border-2 border-white dark:border-zinc-900 ring-2 ring-black/10'
                    : ''
                }`}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}

            <div className="space-y-1.5 flex-1 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Carta Digital Online & Pedidos</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                {restaurant.name}
              </h2>
              {restaurant.address && (
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <span>📍</span>
                  <span>{restaurant.address}</span>
                </p>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                Selecciona tus productos favoritos, personaliza tus ingredientes y confirma directamente por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Selector de Categorías (Sleek Pills) */}
      {categories.length > 0 && (
        <div className="sticky top-14 z-20 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md py-2.5 -mx-4 px-4 overflow-x-auto flex gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeCategoryId === 'all'
                ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            Todo el Menú
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                activeCategoryId === cat.id
                  ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Estado si el menú está vacío */}
      {categories.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Este restaurante aún no ha publicado productos en su carta.
          </p>
          <p className="text-xs text-zinc-500 mt-1">Vuelve pronto para ver las novedades.</p>
        </div>
      )}

      {/* Listado de Productos agrupados por Categoría */}
      <div className="space-y-10">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            {/* Cabecera Sticky del Nombre de la Categoría */}
            <div className="sticky top-[106px] sm:top-[108px] z-10 py-2.5 -mx-4 px-4 sm:-mx-2 sm:px-2 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 sm:rounded-lg">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-100 flex items-center justify-between">
                <span>{cat.name}</span>
                <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                  {cat.products?.length || 0} {cat.products?.length === 1 ? 'producto' : 'productos'}
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {cat.products?.map((prod: Product) => {
                const hasOptions = prod.optionGroups && prod.optionGroups.length > 0;

                return (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
                  >
                    {prod.imageUrl && (
                      <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 right-2 bg-zinc-950/80 dark:bg-zinc-900/90 backdrop-blur-sm text-white font-medium text-xs px-2.5 py-1 rounded-md">
                          {formatCurrency(prod.price)}
                        </span>
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-zinc-950 dark:text-zinc-100 text-sm leading-snug">
                            {prod.name}
                          </h4>
                          {!prod.imageUrl && (
                            <span className="font-bold text-zinc-950 dark:text-zinc-50 text-xs shrink-0">
                              {formatCurrency(prod.price)}
                            </span>
                          )}
                        </div>

                        {prod.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {prod.description}
                          </p>
                        )}

                        {hasOptions && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <Sparkles className="w-3 h-3" />
                            <span>Personalizable (ingredientes y agregados)</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80">
                        <button
                          onClick={() => handleOpenCustomize(prod)}
                          className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 font-medium underline underline-offset-2 flex items-center gap-1"
                        >
                          Personalizar
                        </button>

                        <button
                          onClick={() => handleQuickAdd(prod)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs ${
                            justAddedId === prod.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950'
                          }`}
                        >
                          {justAddedId === prod.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Agregado</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{hasOptions ? 'Personalizar' : 'Agregar'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Personalización de Ingredientes y Opciones */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100 leading-snug">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Base: <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formatCurrency(selectedProduct.price)}</span>
                  {selectedProduct.description && ` • ${selectedProduct.description}`}
                </p>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error de validación si falta un grupo obligatorio */}
            {validationError && (
              <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/40 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* Grupos de Opciones Configurados */}
              {selectedProduct.optionGroups && selectedProduct.optionGroups.length > 0 ? (
                selectedProduct.optionGroups.map((group) => {
                  const selectedInThisGroup = selectedOptions.filter((o) => o.groupId === group.id);
                  const isMaxReached = group.maxSelect > 1 && selectedInThisGroup.length >= group.maxSelect;

                  return (
                    <div key={group.id} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            {group.name}
                          </h4>
                          <span className="text-[11px] text-zinc-500">
                            {group.maxSelect === 1
                              ? 'Elige 1 opción'
                              : `Elige hasta ${group.maxSelect} opciones (${selectedInThisGroup.length}/${group.maxSelect})`}
                          </span>
                        </div>

                        {group.isRequired ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                            Obligatorio
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            Opcional
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.options.map((option) => {
                          const isSelected = selectedOptions.some((o) => o.id === option.id);
                          const isDisabled = !isSelected && isMaxReached;

                          return (
                            <button
                              type="button"
                              key={option.id}
                              disabled={isDisabled}
                              onClick={() => handleToggleOption(group, option)}
                              className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500'
                                  : isDisabled
                                  ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'
                                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded ${
                                    group.maxSelect === 1 ? 'rounded-full' : 'rounded'
                                  } border flex items-center justify-center transition shrink-0 ${
                                    isSelected
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-zinc-300 dark:border-zinc-700'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="font-medium truncate">{option.name}</span>
                              </div>

                              <span className="font-semibold font-mono text-[11px] shrink-0 text-emerald-600 dark:text-emerald-400 pl-1">
                                {Number(option.price) > 0 ? `+${formatCurrency(option.price)}` : 'Gratis'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-zinc-500 py-1">
                  Este producto no cuenta con opciones adicionales de agregados. Puedes escribir instrucciones especiales para la cocina abajo:
                </div>
              )}

              {/* Instrucciones para cocina */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Instrucciones especiales para cocina (opcional):
                </label>
                <textarea
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="Ej: Salsa aparte, carne bien cocida, servilletas extra..."
                  rows={2}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Sticky Footer con Cantidad y Subtotal */}
            <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Cantidad:</span>
                <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setCustomQuantity(Math.max(1, customQuantity - 1))}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                    {customQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomQuantity(customQuantity + 1)}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCustomAdd}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Agregar al Carrito • {formatCurrency(modalTotalPrice)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra Flotante Inferior de Checkout */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-5">
          <Link
            href={`/checkout?tenant=${restaurant.slug}`}
            className="flex items-center justify-between bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 p-3.5 rounded-xl shadow-lg hover:opacity-95 transition border border-zinc-800 dark:border-zinc-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-950 w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs">
                {totalItems}
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-600">Ver pedido</div>
                <div className="text-xs font-semibold">{formatCurrency(subtotal)}</div>
              </div>
            </div>

            <span className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-300 text-white dark:text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-medium transition">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Finalizar</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
