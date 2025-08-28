import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/dbService';
import { CalculatorState, CalculationHistoryItem } from '../types';
import { debounce } from '../utils/debounce';

const DEFAULT_INPUTS = {
    turning: { Dm: '', n: '', vc: '', fn: '', ap: '', lm: '', KAPR: '90', kc: '', kc10: '', mc: '' },
    milling: { Dcap: '', n: '', vc: '', fz: '', zc: '', vf: '', ae: '', ap: '', kc: '' },
    drilling: { DC: '', n: '', vc: '', fn: '', kc: '' },
    boring: { DC: '', ap: '', fn: '', fz: '', zc: '', n: '', vc: '', kc: '' },
    tolerance: { D: '', shaft: '0', hole: '0', round: '3' }
};

const CalculatorStyles = () => (
  <style>{`
    :root{
      --bg:#0f1221; --panel:#171a2f; --muted:#8b92b7; --accent:#7c3aed; --ok:#16a34a; --warn:#f59e0b; --err:#ef4444; --txt:#e9eaf6;
      --card:#1b1f39; --shadow:0 6px 24px rgba(0,0,0,.25);
      --hole:#7B241C; --shaft:#154360;
    }
    .calc-wrapper *{box-sizing:border-box}
    .calc-wrapper{background:linear-gradient(120deg,#0f1221,#0b1020);color:var(--txt);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial; min-height: calc(100vh - 120px); padding: 16px;}
    .calc-wrapper h1,.calc-wrapper h2,.calc-wrapper h3{margin:0 0 .5rem}
    .calc-wrapper .app{max-width:1100px;margin:0 auto;}
    .calc-wrapper .header{display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between;margin-bottom:12px}
    .calc-wrapper .brand{display:flex;align-items:center;gap:10px}
    .calc-wrapper .brand .logo{width:36px;height:36px;border-radius:10px;background:radial-gradient(circle at 30% 30%,#a78bfa,#6d28d9 60%,#3b0764)}
    .calc-wrapper .brand h1{font-size:18px;font-weight:700}
    .calc-wrapper .panel{background:var(--panel);border:1px solid rgba(255,255,255,.05);border-radius:14px;box-shadow:var(--shadow)}
    .calc-wrapper .row{display:flex;gap:12px;flex-wrap:wrap}
    .calc-wrapper .card{background:var(--card);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:14px;box-shadow:var(--shadow)}
    .calc-wrapper .tabs{display:flex;gap:6px;flex-wrap:wrap;padding:8px}
    .calc-wrapper .tab{border:none;background:transparent;color:var(--muted);padding:10px 14px;border-radius:12px;cursor:pointer;transition:.2s}
    .calc-wrapper .tab.active{background:rgba(124,58,237,.18);color:#fff;border:1px solid rgba(124,58,237,.5)}
    .calc-wrapper .unit-toggle{display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,.04);border-radius:12px;border:1px solid rgba(255,255,255,.06)}
    .calc-wrapper .grid{display:grid;grid-template-columns:repeat(12,1fr);gap:10px}
    .calc-wrapper .col-6{grid-column:span 6}
    .calc-wrapper .col-4{grid-column:span 4}
    .calc-wrapper .col-3{grid-column:span 3}
    .calc-wrapper .col-12{grid-column:span 12}
    .calc-wrapper label{display:block;font-weight:600;margin-bottom:6px;color:#cdd3f5}
    .calc-wrapper input,.calc-wrapper select,.calc-wrapper button{padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:#0e1120;color:#e8ebff;outline:none}
    .calc-wrapper input:focus,.calc-wrapper select:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.25)}
    .calc-wrapper .actions{display:flex;gap:8px;flex-wrap:wrap}
    .calc-wrapper .btn{border:none;background:var(--accent);color:#fff;font-weight:700;padding:10px 14px;border-radius:12px;cursor:pointer;box-shadow:var(--shadow)}
    .calc-wrapper .btn.secondary{background:rgba(255,255,255,.06)}
    .calc-wrapper .btn.warn{background:var(--warn)}
    .calc-wrapper .btn.ghost{background:transparent;border:1px dashed rgba(255,255,255,.25)}
    .calc-wrapper .btn:disabled{opacity:.6;cursor:not-allowed}
    .calc-wrapper .outputs{display:grid;grid-template-columns:repeat(12,1fr);gap:10px}
    .calc-wrapper .out{background:rgba(124,58,237,.08);border:1px dashed rgba(124,58,237,.45);border-radius:12px;padding:10px}
    .calc-wrapper .k{font-size:12px;color:#b6bce5}
    .calc-wrapper .v{font-size:18px;font-weight:800}
    .calc-wrapper .muted{color:var(--muted)}
    .calc-wrapper .help{font-size:12px;color:#98a2d7}
    .calc-wrapper .footer{opacity:.85;font-size:12px;padding:10px}
    .calc-wrapper .history{max-height:220px;overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,.06)}
    .calc-wrapper table{width:100%;border-collapse:collapse}
    .calc-wrapper th,.calc-wrapper td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left}
    .calc-wrapper th{position:sticky;top:0;background:#12142a;z-index:1}
    .calc-wrapper .tag{display:inline-block;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08)}
    @media (max-width:920px){.calc-wrapper .col-6,.calc-wrapper .col-4,.calc-wrapper .col-3{grid-column:span 12}}
    .calc-wrapper .t-head{padding:8px 12px;border-radius:10px;color:#fff;font-weight:800;margin-bottom:8px}
    .calc-wrapper .t-head.hole{background:var(--hole)}
    .calc-wrapper .t-head.shaft{background:var(--shaft)}
    .calc-wrapper .u{opacity:.8;margin-left:6px;font-size:12px}
    .calc-wrapper .pill{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:#0b1220}
    .calc-wrapper .pill.ok{border-color:#114b35;background:#062018}
    .calc-wrapper .pill.clr{border-color:#0c3b1d;background:#072515}
    .calc-wrapper .pill.int{border-color:#3b0c0c;background:#250707}
  `}</style>
);

const CalculationToolsPage = () => {
    const savedState = useLiveQuery(() => db.calculatorState.get('default'));
    const history = useLiveQuery(() => db.calculationHistory.orderBy('timestamp').reverse().limit(200).toArray(), []);

    const [unit, setUnit] = useState<'metric' | 'inch'>('metric');
    const [activeTab, setActiveTab] = useState('turning');
    const [inputs, setInputs] = useState(DEFAULT_INPUTS);
    const [outputs, setOutputs] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        if (savedState) {
            setUnit(savedState.unit);
            setActiveTab(savedState.activeTab);
            // Merge saved inputs with defaults to prevent errors if structure changes
            const mergedInputs = JSON.parse(JSON.stringify(DEFAULT_INPUTS));
            for (const tab in savedState.inputs) {
                if (mergedInputs[tab]) {
                    for (const field in savedState.inputs[tab]) {
                        if (field in mergedInputs[tab]) {
                            mergedInputs[tab][field] = savedState.inputs[tab][field];
                        }
                    }
                }
            }
            setInputs(mergedInputs);
        }
    }, [savedState]);

    const saveState = useCallback(debounce(async (state: Omit<CalculatorState, 'id'>) => {
        await db.calculatorState.put({ id: 'default', ...state });
    }, 500), []);

    useEffect(() => {
        saveState({ unit, activeTab, inputs });
    }, [unit, activeTab, inputs, saveState]);
    
    const handleInputChange = (tab: string, field: string, value: string) => {
        setInputs(prev => ({ ...prev, [tab]: { ...prev[tab], [field]: value }}));
    };

    const addHistory = async (module: string, summary: string) => {
        const item: Omit<CalculationHistoryItem, 'id'> = { timestamp: Date.now(), module, unit, summary };
        await db.calculationHistory.add(item as CalculationHistoryItem);
    };

    const clearHistory = async () => {
        await db.calculationHistory.clear();
    };

    const toNum = (v: string) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
    const rad = (deg: number) => deg * Math.PI / 180;
    const fmt = (x: number, digits = 4) => Number.isFinite(x) ? (Math.abs(x) >= 1 ? x.toFixed(digits) : x.toPrecision(3)) : '–';

    const calculate = useCallback((tab: string) => {
        let o: Record<string, any> = {};
        const VFactor = unit === 'metric' ? 1000 : 12;

        if (tab === 'turning') {
            const i = inputs.turning;
            const Dm = toNum(i.Dm), fn = toNum(i.fn), ap = toNum(i.ap), lm = toNum(i.lm);
            let n = toNum(i.n), vc = toNum(i.vc), KAPR = toNum(i.KAPR), kc = toNum(i.kc);
            if (Number.isFinite(vc) && Number.isFinite(Dm)) n = (vc * VFactor) / (Math.PI * Dm);
            else if (Number.isFinite(n) && Number.isFinite(Dm)) vc = (Math.PI * Dm * n) / VFactor;
            
            o.n = n; o.vc = vc;
            const hm = (Number.isFinite(fn) && Number.isFinite(KAPR)) ? (fn * Math.sin(rad(KAPR))) : NaN;
            o.hm = hm;
            if(Number.isFinite(toNum(i.kc10)) && Number.isFinite(toNum(i.mc)) && Number.isFinite(hm)) {
                 kc = toNum(i.kc10) * Math.pow(hm, toNum(i.mc)) * (1 - toNum(i.mc)/100);
            }

            if (unit === 'metric') {
                o.Q = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn)) ? (vc * ap * fn) : NaN;
                o.Pc = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn) && Number.isFinite(kc)) ? (vc * ap * fn * kc) / (60e3) : NaN;
            } else {
                o.Q = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn)) ? (vc * ap * fn * 12) : NaN;
                o.Pc = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn) && Number.isFinite(kc)) ? (vc * ap * fn * kc) / (33e3) : NaN;
            }
            o.Tc = (Number.isFinite(lm) && Number.isFinite(fn) && Number.isFinite(n)) ? (lm / (fn * n)) : NaN;
            addHistory('Tornalama', `Dm=${Dm}, n=${fmt(n)}, vc=${fmt(vc)}, Q=${fmt(o.Q)}, Pc=${fmt(o.Pc)}`);
        }
        
        if (tab === 'milling') {
            const i = inputs.milling;
            const Dcap=toNum(i.Dcap), zc=toNum(i.zc), fz=toNum(i.fz), vf_in=toNum(i.vf), ae=toNum(i.ae), ap=toNum(i.ap), kc=toNum(i.kc);
            let n=toNum(i.n), vc=toNum(i.vc);
            if(Number.isFinite(vc) && Number.isFinite(Dcap)) n = (vc * VFactor)/(Math.PI*Dcap); else if(Number.isFinite(n) && Number.isFinite(Dcap)) vc = (Math.PI*Dcap*n)/VFactor;
            o.n = n; o.vc = vc;

            let vf; if(Number.isFinite(fz) && Number.isFinite(n) && Number.isFinite(zc)) vf = fz*n*zc; else vf = vf_in;
            o.vf = vf;

            if(unit==='metric'){
                o.Q = (Number.isFinite(ap)&&Number.isFinite(ae)&&Number.isFinite(vf)) ? (ap*ae*vf/1000) : NaN; // cm3/dk
                o.Pc = (Number.isFinite(ae)&&Number.isFinite(ap)&&Number.isFinite(vf)&&Number.isFinite(kc)) ? (ae*ap*vf*kc)/(60e6) : NaN; // kW
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*30e3)/n : NaN; // Nm
            } else {
                o.Q = (Number.isFinite(ap)&&Number.isFinite(ae)&&Number.isFinite(vf)) ? (ap*ae*vf) : NaN; // in3/dk
                o.Pc = (Number.isFinite(ae)&&Number.isFinite(ap)&&Number.isFinite(vf)&&Number.isFinite(kc)) ? (ae*ap*vf*kc)/(396e3) : NaN; // HP
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*16501)/n : NaN; // lbf·ft
            }
            addHistory('Frezeleme', `Dcap=${Dcap}, n=${fmt(n)}, vc=${fmt(vc)}, vf=${fmt(vf)}, Q=${fmt(o.Q)}, Pc=${fmt(o.Pc)}`);
        }

        if (tab === 'drilling') {
            const i = inputs.drilling;
            const DC=toNum(i.DC), fn=toNum(i.fn), kc=toNum(i.kc);
            let n=toNum(i.n), vc=toNum(i.vc);
            if(Number.isFinite(vc) && Number.isFinite(DC)) n = (vc * VFactor)/(Math.PI*DC); else if(Number.isFinite(n) && Number.isFinite(DC)) vc = (Math.PI*DC*n)/VFactor;
            o.n = n; o.vc = vc;
            o.vf = (Number.isFinite(fn)&&Number.isFinite(n)) ? (fn*n) : NaN;

            if(unit==='metric'){
                o.Q = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)) ? (vc*DC*fn/4) : NaN; // cm3/dk
                o.Pc = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)&&Number.isFinite(kc)) ? (vc*DC*fn*kc)/(240e3) : NaN; // kW
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*30e3)/n : NaN; // Nm
            } else {
                o.Q = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)) ? (vc*DC*fn*3) : NaN; // in3/dk
                o.Pc = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)&&Number.isFinite(kc)) ? (vc*DC*fn*kc)/(132e3) : NaN; // HP
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*16501)/n : NaN; // lbf·ft
            }
            addHistory('Delik Delme', `DC=${DC}, n=${fmt(n)}, vc=${fmt(vc)}, vf=${fmt(o.vf)}, Q=${fmt(o.Q)}, Pc=${fmt(o.Pc)}`);
        }

        if (tab === 'boring') {
            const i = inputs.boring;
            const DC=toNum(i.DC), ap=toNum(i.ap), kc=toNum(i.kc);
            let fn = toNum(i.fn);
            if(!Number.isFinite(fn) && Number.isFinite(toNum(i.fz)) && Number.isFinite(toNum(i.zc))) fn = toNum(i.zc)*toNum(i.fz);
            let n=toNum(i.n), vc=toNum(i.vc);
            if(Number.isFinite(vc) && Number.isFinite(DC)) n = (vc * VFactor)/(Math.PI*DC); else if(Number.isFinite(n) && Number.isFinite(DC)) vc = (Math.PI*DC*n)/VFactor;
            o.n=n; o.vc=vc;
            o.vf = (Number.isFinite(fn)&&Number.isFinite(n))? fn*n : NaN;
            
            if(unit==='metric'){
                o.Q = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)) ? (vc*DC*fn/4) : NaN; // cm3/dk
                let base = (Number.isFinite(vc)&&Number.isFinite(ap)&&Number.isFinite(fn)&&Number.isFinite(kc)) ? (vc*ap*fn*kc)/(60e3) : NaN; // kW
                o.Pc = (Number.isFinite(base) && Number.isFinite(ap) && Number.isFinite(DC)) ? base * (1 - ap/DC) : base;
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*30e3)/n : NaN;
            } else {
                o.Q = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)) ? (vc*DC*fn*3) : NaN; // in3/dk
                let base = (Number.isFinite(vc)&&Number.isFinite(ap)&&Number.isFinite(fn)&&Number.isFinite(kc)) ? (vc*ap*fn*kc)/(132e3) : NaN; // HP
                o.Pc = (Number.isFinite(base) && Number.isFinite(ap) && Number.isFinite(DC)) ? base * (1 - ap/DC) : base;
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*16501)/n : NaN;
            }
            addHistory('Boring', `DC=${DC}, n=${fmt(n)}, vc=${fmt(vc)}, vf=${fmt(o.vf)}, Q=${fmt(o.Q)}, Pc=${fmt(o.Pc)}`);
        }

        if (tab === 'tolerance') {
            const i = inputs.tolerance;
            const IT_MULT: Record<number, number> = {5:7,6:10,7:16,8:25,9:40,10:64,11:100,12:160,13:250,14:400,15:640,16:1000};
            const parseSel = (v: string) => { if(!v||v==='0') return null; const m = String(v).trim().match(/^([A-Za-z]{1,2})(\d{1,2})$/); if(!m) return null; return {zone:m[1], grade:parseInt(m[2],10)}; };
            const iUnit = (D: number) => 0.45*Math.cbrt(D) + 0.001*D;
            const IT = (D: number, grade: number) => { const k = IT_MULT[grade]; return k? iUnit(D)*k : NaN; };
            const holeDev = (zone: string, T: number) => { if(zone==='H') return {ES:+T, EI:0}; if(zone==='JS') return {ES:+T/2, EI:-T/2}; return null; };
            const shaftDev = (zone: string, T: number) => { if(zone==='h') return {es:0, ei:-T}; if(zone==='js') return {es:+T/2, ei:-T/2}; return null; };
            const fmtMM = (x: number, dec: number) => { if(!isFinite(x)) return '-'; const p=Math.pow(10,dec); return (Math.round(x*p)/p).toFixed(dec); };

            const D = toNum(i.D);
            const dec = parseInt(i.round, 10);
            const sSel = parseSel(i.shaft);
            const hSel = parseSel(i.hole);
            
            if (D > 0 && sSel && hSel) {
                const Ts = IT(D, sSel.grade), Th = IT(D, hSel.grade);
                if (isFinite(Ts) && isFinite(Th)) {
                    const s = shaftDev(sSel.zone, Ts);
                    const h = holeDev(hSel.zone, Th);
                    if (s && h) {
                        o = {
                            mil_tol_u: Math.round(s.es), mil_tol_a: Math.round(s.ei),
                            delik_tol_u: Math.round(h.ES), delik_tol_a: Math.round(h.EI),
                        };
                        const es = s.es/1000, ei = s.ei/1000, ES = h.ES/1000, EI = h.EI/1000;
                        const shaftMax = D + es, shaftMin = D + ei;
                        const holeMax = D + ES, holeMin = D + EI;
                        o = { ...o,
                            mil_max_dia: fmtMM(shaftMax, dec), mil_min_dia: fmtMM(shaftMin, dec),
                            delik_max_dia: fmtMM(holeMax, dec), delik_min_dia: fmtMM(holeMin, dec),
                        };
                        const clrMax = holeMax - shaftMin, clrMin = holeMin - shaftMax;
                        const intMin = Math.max(0, shaftMax - holeMin);
                        o = { ...o, clrMax: fmtMM(clrMax, dec), clrMin: fmtMM(clrMin, dec), intMin: fmtMM(intMin, dec)};

                        if(clrMin >= 0) o.fitText='Boşluklu uyum (clearance fit)';
                        else if(clrMax <= 0) o.fitText='Sıkı geçme (interference fit)';
                        else o.fitText='Geçişli uyum (transition fit)';
                        
                        addHistory('Tolerans', `D=${D}, ${sSel.zone}${sSel.grade}/${hSel.zone}${hSel.grade}, ES/EI=${o.delik_tol_u}/${o.delik_tol_a} µm`);
                    }
                }
            }
        }
        
        setOutputs(prev => ({...prev, [tab]: Object.keys(o).reduce((acc, key) => ({...acc, [key]: fmt(o[key])}), {})}));
    }, [inputs, unit]);
    
    useEffect(() => {
        if (activeTab === 'tolerance') {
            const i = inputs.tolerance;
            if (toNum(i.D) > 0 && i.shaft !== '0' && i.hole !== '0') {
                calculate('tolerance');
            }
        }
    }, [inputs.tolerance, activeTab, calculate]);

    const tabs = [
        { id: 'turning', label: 'Tornalama' },
        { id: 'milling', label: 'Frezeleme' },
        { id: 'drilling', label: 'Delik Delme' },
        { id: 'boring', label: 'Raybalama/Boring' },
        { id: 'tolerance', label: 'Tolerans (ISO 286)' }
    ];

    const o = outputs[activeTab] || {};

    return (
        <div className="calc-wrapper">
             <CalculatorStyles />
            <div className="app">
                 <div className="header">
                    <div className="brand"><div className="logo"></div><h1>İmalat + Tolerans Hesaplayıcı <span className="muted">(TR)</span></h1></div>
                    <div className="unit-toggle">
                        <span className="muted">Birim:</span>
                        <label><input type="radio" name="units" value="metric" checked={unit === 'metric'} onChange={() => setUnit('metric')} /> Metrik (SI)</label>
                        <label><input type="radio" name="units" value="inch" checked={unit === 'inch'} onChange={() => setUnit('inch')} /> İnç</label>
                        <button onClick={clearHistory} className="btn warn">Geçmişi Temizle</button>
                    </div>
                </div>

                <div className="panel">
                    <div className="tabs">
                        {tabs.map(tab => (
                            <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Calculation Cards */}
                    <div className="card">
                        {activeTab === 'turning' && <>
                            <div className="grid">
                                <div className="col-4"><label>Dm – İşlenen Çap (mm / in)</label><input value={inputs.turning.Dm} onChange={e => handleInputChange('turning', 'Dm', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>n – Devir (rpm)</label><input value={inputs.turning.n} onChange={e => handleInputChange('turning', 'n', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>vc – Kesme Hızı (m/dk veya ft/dk)</label><input value={inputs.turning.vc} onChange={e => handleInputChange('turning', 'vc', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>fn – Devir Başına İlerleme (mm/dev | in/rev)</label><input value={inputs.turning.fn} onChange={e => handleInputChange('turning', 'fn', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>ap – Talaş Derinliği (mm | in)</label><input value={inputs.turning.ap} onChange={e => handleInputChange('turning', 'ap', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>lm – İşleme Uzunluğu (mm)</label><input value={inputs.turning.lm} onChange={e => handleInputChange('turning', 'lm', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>KAPR – Giriş Açısı (°)</label><input value={inputs.turning.KAPR} onChange={e => handleInputChange('turning', 'KAPR', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>kc – Kesme Kuvveti Katsayısı (N/mm² | lbf/in²)</label><input value={inputs.turning.kc} onChange={e => handleInputChange('turning', 'kc', e.target.value)} type="number" step="any" /></div>
                                <div className="col-12 actions"><button className="btn" onClick={() => calculate('turning')}>Hesapla</button></div>
                            </div>
                            <div className="outputs" style={{ marginTop: '10px' }}>
                                <div className="out col-3"><div className="k">n (rpm)</div><div className="v">{o.n || '–'}</div></div>
                                <div className="out col-3"><div className="k">vc</div><div className="v">{o.vc || '–'}</div></div>
                                <div className="out col-3"><div className="k">Q – Talaş Kaldırma</div><div className="v">{o.Q || '–'}</div></div>
                                <div className="out col-3"><div className="k">Pc – Net Güç</div><div className="v">{o.Pc || '–'}</div></div>
                                <div className="out col-3"><div className="k">Tc – İşleme Süresi</div><div className="v">{o.Tc || '–'}</div></div>
                                <div className="out col-3"><div className="k">hm – Ort. Talaş Kalınlığı</div><div className="v">{o.hm || '–'}</div></div>
                            </div>
                        </>}

                        {activeTab === 'milling' && <>
                            <div className="grid">
                                <div className="col-4"><label>Dcap – ap derinliğindeki çap (mm | in)</label><input value={inputs.milling.Dcap} onChange={e => handleInputChange('milling', 'Dcap', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>n – Devir (rpm)</label><input value={inputs.milling.n} onChange={e => handleInputChange('milling', 'n', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>vc – Kesme Hızı (m/dk | ft/dk)</label><input value={inputs.milling.vc} onChange={e => handleInputChange('milling', 'vc', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>fz – Diş Başına İlerleme (mm | in)</label><input value={inputs.milling.fz} onChange={e => handleInputChange('milling', 'fz', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>zc – Diş Adedi (pcs)</label><input value={inputs.milling.zc} onChange={e => handleInputChange('milling', 'zc', e.target.value)} type="number" step="1" /></div>
                                <div className="col-4"><label>vf – Tabla İlerlemesi (mm/dk | in/dk)</label><input value={inputs.milling.vf} onChange={e => handleInputChange('milling', 'vf', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>ae – Yanaldan Eşg. (mm | in)</label><input value={inputs.milling.ae} onChange={e => handleInputChange('milling', 'ae', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>ap – Talaş Derinliği (mm | in)</label><input value={inputs.milling.ap} onChange={e => handleInputChange('milling', 'ap', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>kc – Kesme Kuvveti Katsayısı (N/mm² | lbf/in²)</label><input value={inputs.milling.kc} onChange={e => handleInputChange('milling', 'kc', e.target.value)} type="number" step="any" /></div>
                                <div className="col-12 actions"><button className="btn" onClick={() => calculate('milling')}>Hesapla</button></div>
                            </div>
                            <div className="outputs" style={{ marginTop: '10px' }}>
                                <div className="out col-3"><div className="k">n (rpm)</div><div className="v">{o.n || '–'}</div></div>
                                <div className="out col-3"><div className="k">vc</div><div className="v">{o.vc || '–'}</div></div>
                                <div className="out col-3"><div className="k">vf</div><div className="v">{o.vf || '–'}</div></div>
                                <div className="out col-3"><div className="k">Q – Talaş Kaldırma</div><div className="v">{o.Q || '–'}</div></div>
                                <div className="out col-3"><div className="k">Pc – Net Güç</div><div className="v">{o.Pc || '–'}</div></div>
                                <div className="out col-3"><div className="k">Mc – Tork</div><div className="v">{o.Mc || '–'}</div></div>
                            </div>
                        </>}

                        {activeTab === 'drilling' && <>
                            <div className="grid">
                                <div className="col-4"><label>DC – Matkap Çapı (mm | in)</label><input value={inputs.drilling.DC} onChange={e => handleInputChange('drilling', 'DC', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>n – Devir (rpm)</label><input value={inputs.drilling.n} onChange={e => handleInputChange('drilling', 'n', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>vc – Kesme Hızı (m/dk | ft/dk)</label><input value={inputs.drilling.vc} onChange={e => handleInputChange('drilling', 'vc', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>fn – Devir Başına İlerleme (mm/dev | in/rev)</label><input value={inputs.drilling.fn} onChange={e => handleInputChange('drilling', 'fn', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>kc – Kesme Kuvveti Katsayısı (N/mm² | lbf/in²)</label><input value={inputs.drilling.kc} onChange={e => handleInputChange('drilling', 'kc', e.target.value)} type="number" step="any" /></div>
                                <div className="col-12 actions"><button className="btn" onClick={() => calculate('drilling')}>Hesapla</button></div>
                            </div>
                            <div className="outputs" style={{ marginTop: '10px' }}>
                                <div className="out col-3"><div className="k">n (rpm)</div><div className="v">{o.n || '–'}</div></div>
                                <div className="out col-3"><div className="k">vc</div><div className="v">{o.vc || '–'}</div></div>
                                <div className="out col-3"><div className="k">vf – Delme İlerlemesi</div><div className="v">{o.vf || '–'}</div></div>
                                <div className="out col-3"><div className="k">Q – Talaş Kaldırma</div><div className="v">{o.Q || '–'}</div></div>
                                <div className="out col-3"><div className="k">Pc – Net Güç</div><div className="v">{o.Pc || '–'}</div></div>
                                <div className="out col-3"><div className="k">Mc – Tork</div><div className="v">{o.Mc || '–'}</div></div>
                            </div>
                        </>}

                        {activeTab === 'boring' && <>
                            <div className="grid">
                                <div className="col-4"><label>DC – Delik Çapı (mm | in)</label><input value={inputs.boring.DC} onChange={e => handleInputChange('boring', 'DC', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>ap – Talaş Derinliği (mm | in)</label><input value={inputs.boring.ap} onChange={e => handleInputChange('boring', 'ap', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>fn – Devir Başına İlerleme (mm/dev | in/rev)</label><input value={inputs.boring.fn} onChange={e => handleInputChange('boring', 'fn', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>fz – Diş Başına İlerleme (ops.)</label><input value={inputs.boring.fz} onChange={e => handleInputChange('boring', 'fz', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>zc – Diş Adedi (ops.)</label><input value={inputs.boring.zc} onChange={e => handleInputChange('boring', 'zc', e.target.value)} type="number" step="1" /></div>
                                <div className="col-4"><label>n – Devir (rpm)</label><input value={inputs.boring.n} onChange={e => handleInputChange('boring', 'n', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>vc – Kesme Hızı (m/dk | ft/dk)</label><input value={inputs.boring.vc} onChange={e => handleInputChange('boring', 'vc', e.target.value)} type="number" step="any" /></div>
                                <div className="col-4"><label>kc – Kesme Kuvveti Katsayısı</label><input value={inputs.boring.kc} onChange={e => handleInputChange('boring', 'kc', e.target.value)} type="number" step="any" /></div>
                                <div className="col-12 actions"><button className="btn" onClick={() => calculate('boring')}>Hesapla</button></div>
                            </div>
                            <div className="outputs" style={{ marginTop: '10px' }}>
                                <div className="out col-3"><div className="k">n (rpm)</div><div className="v">{o.n || '–'}</div></div>
                                <div className="out col-3"><div className="k">vc</div><div className="v">{o.vc || '–'}</div></div>
                                <div className="out col-3"><div className="k">vf</div><div className="v">{o.vf || '–'}</div></div>
                                <div className="out col-3"><div className="k">Q</div><div className="v">{o.Q || '–'}</div></div>
                                <div className="out col-3"><div className="k">Pc</div><div className="v">{o.Pc || '–'}</div></div>
                                <div className="out col-3"><div className="k">Mc</div><div className="v">{o.Mc || '–'}</div></div>
                            </div>
                        </>}
                        
                        {activeTab === 'tolerance' && <>
                            <div className="grid">
                                <div className="col-6">
                                    <div className="grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                                        <div>
                                            <label>Nominal çap D</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input value={inputs.tolerance.D} onChange={e => handleInputChange('tolerance', 'D', e.target.value)} type="number" step="0.001" min="0" style={{ flex: 1 }} />
                                                <span className="u">mm</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label>Yuvarlama (mm)</label>
                                            <select value={inputs.tolerance.round} onChange={e => handleInputChange('tolerance', 'round', e.target.value)}>
                                                <option value="3">3 ondalık</option><option value="2">2 ondalık</option><option value="4">4 ondalık</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label>Mil toleransı</label>
                                            <select value={inputs.tolerance.shaft} onChange={e => handleInputChange('tolerance', 'shaft', e.target.value)}>
                                                <option value="0">Seçiniz</option>
                                                {['h','js'].flatMap(z => [5,6,7,8,9,10,11,12,13,14,15,16].map(g => <option key={z+g} value={z+g}>{z+g}</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <label>Delik toleransı</label>
                                            <select value={inputs.tolerance.hole} onChange={e => handleInputChange('tolerance', 'hole', e.target.value)}>
                                                <option value="0">Seçiniz</option>
                                                {['H','JS'].flatMap(z => [5,6,7,8,9,10,11,12,13,14,15,16].map(g => <option key={z+g} value={z+g}>{z+g}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="actions" style={{ marginTop: '8px' }}>
                                        <button className="btn" onClick={() => calculate('tolerance')}>Hesapla</button>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                                        <div className="card" style={{ padding: '10px' }}>
                                            <div className="t-head shaft">Mil Ölçüleri</div>
                                            <table><tbody>
                                                <tr><td>Max mil çapı</td><td style={{ textAlign: 'right' }}><span>{o.mil_max_dia || '-'}</span> <span className="u">mm</span></td></tr>
                                                <tr><td>Min mil çapı</td><td style={{ textAlign: 'right' }}><span>{o.mil_min_dia || '-'}</span> <span className="u">mm</span></td></tr>
                                                <tr><td>Üst tolerans (es)</td><td style={{ textAlign: 'right' }}><span>{o.mil_tol_u || '-'}</span> <span className="u">µm</span></td></tr>
                                                <tr><td>Alt tolerans (ei)</td><td style={{ textAlign: 'right' }}><span>{o.mil_tol_a || '-'}</span> <span className="u">µm</span></td></tr>
                                            </tbody></table>
                                        </div>
                                        <div className="card" style={{ padding: '10px' }}>
                                            <div className="t-head hole">Delik Ölçüleri</div>
                                            <table><tbody>
                                                <tr><td>Max delik çapı</td><td style={{ textAlign: 'right' }}><span>{o.delik_max_dia || '-'}</span> <span className="u">mm</span></td></tr>
                                                <tr><td>Min delik çapı</td><td style={{ textAlign: 'right' }}><span>{o.delik_min_dia || '-'}</span> <span className="u">mm</span></td></tr>
                                                <tr><td>Üst tolerans (ES)</td><td style={{ textAlign: 'right' }}><span>{o.delik_tol_u || '-'}</span> <span className="u">µm</span></td></tr>
                                                <tr><td>Alt tolerans (EI)</td><td style={{ textAlign: 'right' }}><span>{o.delik_tol_a || '-'}</span> <span className="u">µm</span></td></tr>
                                            </tbody></table>
                                        </div>
                                    </div>
                                    <div className="card" style={{ marginTop: '10px' }}>
                                        <h3>Uygunluk</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                                            <div className="pill"><span>Maks. boşluk</span><b>{o.clrMax || '-'}</b> <span className="u">mm</span></div>
                                            <div className="pill"><span>Min. boşluk</span><b>{o.clrMin || '-'}</b> <span className="u">mm</span></div>
                                            <div className="pill"><span>Min. sıkılık</span><b>{o.intMin || '-'}</b> <span className="u">mm</span></div>
                                        </div>
                                        <div className="pill ok" style={{ marginTop: '8px' }}><b>Durum:</b> <span>{o.fitText || '-'}</span></div>
                                    </div>
                                </div>
                            </div>
                        </>}
                    </div>

                    <div className="card" style={{ marginTop: '12px' }}>
                        <h3>Hesap Geçmişi</h3>
                        <div className="history">
                            <table>
                                <thead><tr><th>Zaman</th><th>Modül</th><th>Birim</th><th>Özet</th></tr></thead>
                                <tbody>
                                    {history?.map(h => (
                                        <tr key={h.id}>
                                            <td>{new Date(h.timestamp).toLocaleString()}</td>
                                            <td><span className="tag">{h.module}</span></td>
                                            <td>{h.unit === 'metric' ? 'SI' : 'İnç'}</td>
                                            <td className="muted">{h.summary}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CalculationToolsPage;