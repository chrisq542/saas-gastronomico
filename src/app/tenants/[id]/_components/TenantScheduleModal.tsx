'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import {
  DaySchedule,
  DEFAULT_WEEK_SCHEDULE,
  parseSchedule,
  serializeSchedule,
  DAYS_OF_WEEK,
} from '@/lib/utils/schedule';
import { Clock, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';

interface TenantScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScheduleRaw?: string | null;
  onSave: (serializedSchedule: string) => void;
}

export default function TenantScheduleModal({
  isOpen,
  onClose,
  currentScheduleRaw,
  onSave,
}: TenantScheduleModalProps) {
  const [days, setDays] = useState<DaySchedule[]>(() => {
    return parseSchedule(currentScheduleRaw) || DEFAULT_WEEK_SCHEDULE;
  });

  const [copiedDay, setCopiedDay] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDays(parseSchedule(currentScheduleRaw) || DEFAULT_WEEK_SCHEDULE);
    }
  }, [isOpen, currentScheduleRaw]);

  const handleToggleDay = (index: number) => {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, isOpen: !day.isOpen } : day))
    );
  };

  const handleTimeChange = (
    index: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  const handleCopyDayToAll = (fromIndex: number) => {
    const source = days[fromIndex];
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        isOpen: source.isOpen,
        openTime: source.openTime,
        closeTime: source.closeTime,
      }))
    );
    setCopiedDay(source.day);
    setTimeout(() => setCopiedDay(null), 1500);
  };

  const handleQuickPreset = (type: 'all-week' | 'mon-fri' | 'reset') => {
    if (type === 'all-week') {
      setDays((prev) =>
        prev.map((d) => ({
          ...d,
          isOpen: true,
          openTime: '12:00',
          closeTime: '23:00',
        }))
      );
    } else if (type === 'mon-fri') {
      setDays((prev) =>
        prev.map((d, i) => ({
          ...d,
          isOpen: i < 5,
          openTime: '12:00',
          closeTime: i < 5 ? '22:30' : d.closeTime,
        }))
      );
    } else if (type === 'reset') {
      setDays(DEFAULT_WEEK_SCHEDULE);
    }
  };

  const handleApply = () => {
    const serialized = serializeSchedule(days);
    onSave(serialized);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 leading-tight">
              Configurar Horarios por Día (7 Días)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              Indica la hora de apertura y cierre para cada día de la semana
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Barra de atajos rápidos */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium">Plantillas de configuración:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleQuickPreset('all-week')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition cursor-pointer text-[11px]"
            >
              Todos los días 12:00 - 23:00
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('mon-fri')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition cursor-pointer text-[11px]"
            >
              Lun a Vie (Cerrar Sáb/Dom)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('reset')}
              className="px-2 py-1 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition cursor-pointer text-[11px] flex items-center gap-1"
              title="Restablecer valores recomendados"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>

        {/* Tabla de los 7 días */}
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {days.map((dayItem, index) => {
            const isWeekend = index >= 5;
            return (
              <div
                key={dayItem.day}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl border transition-colors ${
                  dayItem.isOpen
                    ? 'bg-white dark:bg-zinc-950 border-zinc-200/90 dark:border-zinc-800 shadow-xs'
                    : 'bg-zinc-50/70 dark:bg-zinc-900/40 border-dashed border-zinc-200 dark:border-zinc-800/80 opacity-75'
                }`}
              >
                {/* Nombre del día y switch abierto/cerrado */}
                <div className="flex items-center gap-3 min-w-[150px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayItem.isOpen}
                      onChange={() => handleToggleDay(index)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-500"></div>
                  </label>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-zinc-100">
                        {dayItem.day}
                      </span>
                      {isWeekend && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                          FDS
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        dayItem.isOpen
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {dayItem.isOpen ? 'Abierto' : 'Cerrado / Descanso'}
                    </span>
                  </div>
                </div>

                {/* Horas de Apertura y Cierre */}
                {dayItem.isOpen ? (
                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 mb-0.5">Apertura</span>
                        <input
                          type="time"
                          value={dayItem.openTime}
                          onChange={(e) =>
                            handleTimeChange(index, 'openTime', e.target.value)
                          }
                          className="px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <span className="text-zinc-400 font-bold self-end pb-2">a</span>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 mb-0.5">Cierre</span>
                        <input
                          type="time"
                          value={dayItem.closeTime}
                          onChange={(e) =>
                            handleTimeChange(index, 'closeTime', e.target.value)
                          }
                          className="px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyDayToAll(index)}
                      className="p-2 self-end mb-0.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title={`Copiar horario de ${dayItem.day} a toda la semana`}
                    >
                      {copiedDay === dayItem.day ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400 italic py-1 self-start sm:self-auto">
                    Sin atención al público
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botones de acción del modal */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Horario Semanal</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
