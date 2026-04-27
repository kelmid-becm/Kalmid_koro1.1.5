import fs from 'fs';

const txt = fs.readFileSync('src/App.tsx', 'utf-8');

const lines = txt.split('\n');

// Find the line that starts with "                          alert(language === 'ar' ? 'الموقع الجغرافي " and delete it, and replace it with proper string.
const idxList = lines.findIndex(l => l.includes("الموقع الجغرافي غير مدعوم في هذا المتصفح"));
if (idxList !== -1) {
  lines[idxList] = `                         alert(language === 'ar' ? 'الموقع الجغرافي غير مدعوم في هذا المتصفح. إذا كنت داخل تطبيق (WebView) يجب على مطور التطبيق منح الصلاحية.' : 'Geolocation is not supported in this browser. If you are inside an app (WebView), the app developer must grant the permission.');
                       }
                     }}
                     className={\`px-4 py-2 \${permissionStates.loc ? 'bg-blue-500 text-white' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'} text-xs font-bold rounded-lg transition-colors border border-blue-500/20 cursor-pointer\`}
                   >
                     {permissionStates.loc ? (language === 'ar' ? 'تم التفعيل' : 'Granted') : (language === 'ar' ? 'تفعيل' : 'Grant')}
                   </button>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">`;
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log("Fixed src/App.tsx");
} else {
  console.log("Not found.");
}
