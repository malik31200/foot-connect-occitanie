import html
W,H=1700,1395
C={'compte':'#FFE8EC','sport':'#E5F4E4','social':'#E7F1FB','admin':'#FFF6D6'}
S={'compte':'#E4002B','sport':'#22A05A','social':'#3B6EA8','admin':'#C9A100'}
L=620; R=1080
left=[('S\'inscrire (CGU)','compte',110),('Consulter les matchs à venir et terminés','sport',182),('Consulter le classement et le calendrier','sport',254),
('Vérifier son email (V1)','compte',350),('Réinitialiser ou changer son mot de passe','compte',422),('Publier des photos ou une vidéo d\'un match','social',494),('Recevoir des notifications (V1)','social',566),
('Se connecter / se déconnecter','compte',638),('Modifier son profil','compte',710),('Supprimer son compte','compte',782),('Liker, commenter, partager','social',854),('Suivre un utilisateur','social',926),('Envoyer un message privé','social',998),('Rechercher','social',1070),('Signaler un contenu, bloquer un utilisateur','social',1142),('Proposer le score de son match (V1)','admin',1234)]
right=[('Gérer clubs, équipes et matchs','admin',640),('Importer les calendriers FFF','admin',712),('Saisir ou corriger un score','admin',784),('Modérer posts, commentaires, comptes','admin',856),('Consulter les statistiques','admin',928),('Valider un score proposé (V1)','admin',1234)]
out=[]
def t(x,y,s,size=15,anchor='middle',w='normal',fill='#1A1614'):
    out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" font-weight="{w}" fill="{fill}" font-family="Arial, sans-serif">{html.escape(s)}</text>')
def line(x1,y1,x2,y2,dash=False,col='#5C564F'):
    d=' stroke-dasharray="6,5"' if dash else ''
    out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="1.4"{d}/>')
def actor(x,y,name):
    out.append(f'<circle cx="{x}" cy="{y-48}" r="14" fill="#fff" stroke="#1A1614" stroke-width="2"/>')
    for a in [(x,y-34,x,y),(x-24,y-22,x+24,y-22),(x,y,x-18,y+30),(x,y,x+18,y+30)]:
        out.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{a[2]}" y2="{a[3]}" stroke="#1A1614" stroke-width="2"/>')
    for i,part in enumerate(name.split('\n')): t(x,y+52+i*18,part,15,'middle','bold')
def ell(cx,cy,label,cat):
    out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="190" ry="26" fill="{C[cat]}" stroke="{S[cat]}" stroke-width="1.5"/>')
    t(cx,cy+5,label,14)
# boundary
out.append(f'<rect x="380" y="50" width="940" height="1240" rx="10" fill="#FAFAF8" stroke="#5C564F" stroke-width="2"/>')
t(850,80,'Système : Foot Connect Occitanie',18,'middle','bold')
# actors
VIS=(170,230); USR=(170,760); COA=(170,1250); ADM=(1530,860)
actor(*VIS,'Visiteur'); actor(*USR,'Utilisateur\n(parent, joueur, supporter)'); actor(*COA,'Coach / Dirigeant'); actor(*ADM,'Administrateur')
# generalisation arrows (child -> parent, hollow triangle)
def gen(x,y1,y2):
    line(x,y1,x,y2+14)
    out.append(f'<polygon points="{x},{y2} {x-9},{y2+16} {x+9},{y2+16}" fill="#fff" stroke="#1A1614" stroke-width="1.5"/>')
gen(170,USR[1]-64,VIS[1]+70); gen(170,COA[1]-64,USR[1]+88)
t(185,520,'hérite de',13,'start','normal','#5C564F'); t(185,1030,'hérite de',13,'start','normal','#5C564F')
for lab,cat,y in left[:3]: line(VIS[0]+30,VIS[1]-22,L-190,y)
for lab,cat,y in left[3:15]: line(USR[0]+30,USR[1]-22,L-190,y)
line(COA[0]+30,COA[1]-22,L-190,left[15][2])
for lab,cat,y in right: line(ADM[0]-30,ADM[1]-22,R+190,y)
# externals
EXT=[('Resend','(emails)',1530,330),('Cloudflare R2','(photos, vidéos)',1530,470),('Expo Push (V1)','(notifications)',1530,590)]
for n,s,x,y in EXT:
    out.append(f'<rect x="{x-95}" y="{y-30}" width="190" height="60" rx="4" fill="#E7F1FB" stroke="#3B6EA8" stroke-width="1.5"/>')
    t(x,y-10,'«système externe»',11,'middle','normal','#3B6EA8'); t(x,y+7,n,14,'middle','bold'); t(x,y+23,s,12)
line(L+190,350,1435,330,True,'#3B6EA8'); line(L+190,422,1435,335,True,'#3B6EA8')
line(L+190,494,1435,470,True,'#3B6EA8'); line(L+190,566,1435,590,True,'#3B6EA8')
# coach -> validation
y=1234
out.append(f'<line x1="{L+190}" y1="{y}" x2="{R-196}" y2="{y}" stroke="#C9A100" stroke-width="1.6" stroke-dasharray="6,5" marker-end="url(#arr)"/>')
t(850,y-10,'«validé par»',13,'middle','normal','#8A6D00')
for lab,cat,yy in left: ell(L,yy,lab,cat)
for lab,cat,yy in right: ell(R,yy,lab,cat)
# legend
lx=400; ly=1325
for i,(k,n) in enumerate([('compte','Compte'),('sport','Suivi sportif'),('social','Réseau social'),('admin','Administration')]):
    x=lx+i*230
    out.append(f'<ellipse cx="{x+20}" cy="{ly}" rx="18" ry="9" fill="{C[k]}" stroke="{S[k]}"/>'); t(x+46,ly+5,n,13,'start')
t(400,ly+35,'(V1) = prévu pendant la période Portfolio',13,'start','normal','#5C564F')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#C9A100"/></marker></defs><rect width="100%" height="100%" fill="#fff"/>{''.join(out)}</svg>'''
open(__import__('sys').argv[1],'w').write(f'<!doctype html><html><body style="margin:0">{svg}</body></html>')
