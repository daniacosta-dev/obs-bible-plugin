; obs-bible-overlay.iss — Inno Setup Script
; Compilar local: ISCC installer\obs-bible-overlay.iss
; Output:         dist\obs-bible-overlay-setup.exe
;
; Instala en %LocalAppData%\Programs\OBS Bible Overlay\ (sin permisos de admin)

#define AppName      "OBS Bible Overlay"
#define AppVersion   "0.1.0"
#define AppPublisher "Dani Acosta"
#define AppURL       "https://github.com/deacostac/obs-bible-plugin"
#define AppExeName   "obs-bible-overlay.exe"
#define SourceDir    "..\dist\obs-bible-overlay"

[Setup]
; IMPORTANTE: No cambiar el AppId una vez publicada la primera versión.
; Windows usa este GUID para identificar actualizaciones del instalador.
AppId={{A7F3E2D1-8C5B-4A9F-B6E3-2D1C8A5F9E7B}}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}/issues
AppUpdatesURL={#AppURL}/releases
; Sin elevación — instala en AppData del usuario, sin permisos de admin
DefaultDirName={localappdata}\Programs\{#AppName}
DefaultGroupName={#AppName}
AllowNoIcons=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=..\dist
OutputBaseFilename=obs-bible-overlay-setup
SetupIconFile=..\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Installer
VersionInfoProductName={#AppName}

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Crear acceso directo en el escritorio"; GroupDescription: "Accesos directos adicionales:"; Flags: unchecked
Name: "startup"; Description: "Iniciar automáticamente al encender Windows"; GroupDescription: "Al iniciar Windows:"; Flags: unchecked

[Files]
Source: "{#SourceDir}\{#AppExeName}";  DestDir: "{app}";       Flags: ignoreversion
Source: "{#SourceDir}\icon.ico";        DestDir: "{app}";       Flags: ignoreversion
Source: "{#SourceDir}\icon.png";        DestDir: "{app}";       Flags: ignoreversion
Source: "{#SourceDir}\data\*";          DestDir: "{app}\data";  Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}";              Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\icon.ico"
Name: "{group}\Desinstalar {#AppName}";  Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}";        Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Registry]
; Arranque automático con Windows (solo si el usuario marca la opción)
Root: HKCU; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#AppName}"; ValueData: """{app}\{#AppExeName}"""; Flags: uninsdeletevalue; Tasks: startup

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Iniciar {#AppName} ahora"; Flags: nowait postinstall skipifsilent

[Code]
// Limpia archivos generados en tiempo de ejecución al desinstalar
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    DelTree(ExpandConstant('{app}\.tray'), True, True, True);
    DeleteFile(ExpandConstant('{app}\obs-bible-overlay.log'));
    DeleteFile(ExpandConstant('{app}\obs-bible-overlay-error.log'));
    DeleteFile(ExpandConstant('{app}\icon.ico'));
    RemoveDir(ExpandConstant('{app}'));
  end;
end;
