'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import {
  parseSchedule,
  getTodayDayIndex,
  getRestaurantOpenStatus,
  DaySchedule,
} from '@/lib/utils/schedule';
import { Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface RestaurantScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  scheduleRaw?: string | null;
}

export default function RestaurantScheduleModal({
  isOpen,
  onClose,
  restaurantName,
  scheduleRaw,
}: RestaurantScheduleModalProps) {
  const structuredDays = parseSchedule(scheduleRaw);
  const status = getRestaurantOpenStatus(scheduleRaw);
  const todayIndex = getTodayDayIndex();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 leading-tight">
              Horario de Atención
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              {restaurantName}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner de Estado Actual */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            status.isOpen
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300'
              : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
              }`}
            />
            <div>
              <p className="text-xs font-bold leading-tight">{status.statusText}</p>
              <p className="text-[11px] opacity-80">{status.detailText}</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/40 border border-current/15">
            {status.isOpen ? 'Atención activa' : 'Fuera de horario'}
          </span>
        </div>

        {/* Lista de Días */}
        {structuredDays ? (
          <div className="space-y-1.5">
            {structuredDays.map((item: DaySchedule, index: number) => {
              const isToday = index === todayIndex;
              return (
                <div
                  key={item.day}
                  className={`flex items-center justify-between py-2 px-3 rounded-xl text-xs transition-all ${
                    isToday
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 font-semibold'
                      : 'border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-xs">{item.day}</span>
                    {isToday && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold leading-none">
                        Hoy
                      </span>
                    )}
                  </div>

                  {item.isOpen ? (
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                        {item.openTime}
                      </span>
                      <span className="text-zinc-400 text-[10px]">a</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                        {item.closeTime} hrs
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-400 italic">Cerrado</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
            {scheduleRaw || 'No se ha configurado un horario específico.'}
          </div>
        )}

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}
