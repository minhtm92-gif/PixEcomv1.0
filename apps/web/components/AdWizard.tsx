'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';

export default function AdWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<'EXISTING_POST' | 'CONTENT_SOURCE'>('CONTENT_SOURCE');
  const [result, setResult] = useState<any>();

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Create New Facebook Ad
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-4">
          <div className="modal-shell w-[1100px] h-[85vh] p-3 flex flex-col">
            <div className="h-[44px] border-b border-[var(--border-subtle)] font-semibold text-[13px] flex items-center sticky top-0 bg-[var(--bg-surface)] z-10">
              Create New Facebook Ad - Step {step}
            </div>

            <div className="overflow-y-auto flex-1 py-3 text-[11px] space-y-3">
              {step === 1 ? (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    'Strategy', 'Sellpage', 'Facebook Page', 'Ad Account', 'Pixel', 'Conversion', 'Campaigns #', 'Budget/campaign', 'Status',
                    'Audience', 'Location', 'Gender', 'Age', 'Attribution', 'Optimization Goal', 'AdSets #', 'Ads / AdSet'
                  ].map((f) => (
                    <label key={f} className="space-y-1">
                      <div className="subtle">{f}</div>
                      <input className="input w-full h-[30px]" />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {['Ad1', 'Ad2', 'Ad3'].map((a) => (
                      <div key={a} className="card p-2 text-[12px]">{a}</div>
                    ))}
                  </div>
                  <div className="space-x-1">
                    <button className="btn" onClick={() => setSourceType('EXISTING_POST')}>Existing Post</button>
                    <button className="btn" onClick={() => setSourceType('CONTENT_SOURCE')}>Content Source</button>
                  </div>
                  {sourceType === 'EXISTING_POST' ? (
                    <div className="card p-3 text-[11px]">No posts available. Please create a new ad post from Content Source.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {['Media', 'Thumbnails', 'Adtexts'].map((t) => (
                        <div key={t} className="card p-2 text-[11px]">
                          {t} picker list by product code + version + spent/roas
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result && <pre className="text-[10px] muted">{JSON.stringify(result, null, 2)}</pre>}
            </div>

            <div className="h-[46px] flex justify-end gap-1 border-t border-[var(--border-subtle)] pt-2">
              <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
              {step > 1 && <button className="btn" onClick={() => setStep(1)}>Back</button>}
              {step < 2 ? (
                <button className="btn btn-primary" onClick={() => setStep(2)}>Next</button>
              ) : (
                <button className="btn btn-primary" onClick={async () => setResult(await postJson('/ad-wizard/submit', { sourceType }))}>Submit</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
