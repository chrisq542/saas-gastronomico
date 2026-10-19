'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductOptionGroup, ProductOption, SelectedProductOption } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { X, Check, Minus, Plus, ShoppingBag, Info } from 'lucide-react';

interface ProductCustomizeModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    note: string,
    options: SelectedProductOption[]
  ) => void;
}

export default function ProductCustomizeModal({
  product,
  onClose,
  onAddToCart,
}: ProductCustomizeModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<SelectedProductOption[]>([]);
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [itemNote, setItemNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedOptions([]);
      setCustomQuantity(1);
      setItemNote('');
      setValidationError(null);
    }
  }, [product]);

  if (!product) return null;

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

  const handleSubmit = () => {
    // Validar grupos obligatorios
    if (product.optionGroups) {
      for (const group of product.optionGroups) {
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

    onAddToCart(product, customQuantity, itemNote, selectedOptions);
    onClose();
  };

  // Cálculo de precio dinámico
  const optionsTotal = selectedOptions.reduce((sum, o) => sum + Number(o.price || 0), 0);
  const singleItemPrice = Number(product.price || 0) + optionsTotal;
  const modalTotalPrice = singleItemPrice * customQuantity;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100 leading-snug">
              {product.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Base:{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                {formatCurrency(product.price)}
              </span>
              {product.description && ` • ${product.description}`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Cerrar modal"
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
          {product.optionGroups && product.optionGroups.length > 0 ? (
            product.optionGroups.map((group) => {
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
                              className={`w-4 h-4 ${
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
                aria-label="Disminuir cantidad"
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
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Agregar al Carrito • {formatCurrency(modalTotalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
