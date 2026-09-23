import React from 'react';
import { Modal } from '../common/Modal';
import { useLocation } from '../../hooks/useLocation';

export function LocationModal({ isOpen, onClose }) {
  const { location, updateLocation } = useLocation();

  const handleSelect = (pincode, address) => {
    updateLocation({ shortAddress: address, pincode });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Your Delivery Location">
      <div className="space-y-3 text-xs">
        <p className="text-stone-500">Select your Bengaluru neighborhood for 90-minute morning harvest dispatch:</p>
        <div className="grid grid-cols-1 gap-2">
          {[
            { tag: 'Indiranagar', pin: '560038', desc: 'Central Hub • Express Available' },
            { tag: 'Koramangala', pin: '560034', desc: '4th Block Hub • Express Available' },
            { tag: 'HSR Layout', pin: '560102', desc: 'Sector 2 Hub • Express Available' },
            { tag: 'Whitefield', pin: '560066', desc: 'Prestige Hub • Express Available' }
          ].map(item => (
            <button
              key={item.pin}
              onClick={() => handleSelect(item.pin, item.tag + ', Bengaluru')}
              className="p-3 rounded-2xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-stone-900 block">{item.tag}</span>
                <span className="text-[10px] text-stone-400">{item.desc}</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">{item.pin}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
