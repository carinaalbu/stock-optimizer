import pulp

def optimizare_retea_stocuri(filiale, stoc_curent, stoc_minim, pret_produs, costuri_transport):
    """
    Rezolvă problema de redistribuire a stocurilor pentru a maximiza profitul net.
    """
    # 1. Separăm filialele în funcție de Surplus (Oferta) și Deficit (Cererea)
    surplus = {}
    deficit = {}
    
    for f in filiale:
        if stoc_curent[f] > stoc_minim[f]:
            surplus[f] = stoc_curent[f] - stoc_minim[f]
        elif stoc_curent[f] < stoc_minim[f]:
            deficit[f] = stoc_minim[f] - stoc_curent[f]
            
    # Validare fezabilitate (Avem suficient stoc la nivel național?)
    if sum(surplus.values()) < sum(deficit.values()):
        return "Model Infezabil: Deficitul total este mai mare decât surplusul disponibil în rețea."

    # 2. Inițializarea modelului de Maximizare
    model = pulp.LpProblem("Maximizare_Profit_Stocuri", pulp.LpMaximize)

    # 3. Definirea variabilelor de decizie (Câte produse mutăm de la i la j)
    # Folosim Integer pentru că nu putem trimite jumătăți de produse
    x = pulp.LpVariable.dicts("Transfer",
                              [(i, j) for i in surplus for j in deficit],
                              lowBound=0,
                              cat='Integer')

    # 4. Funcția Obiectiv: Maximizăm (Pret - Cost Transport) * Cantitatea transferată
    model += pulp.lpSum([(pret_produs - costuri_transport[i][j]) * x[(i, j)] 
                         for i in surplus for j in deficit]), "Profit_Total"

    # 5. Constrângerea 1: Nu trimite mai mult decât surplusul disponibil
    for i in surplus:
        model += pulp.lpSum([x[(i, j)] for j in deficit]) <= surplus[i], f"Max_Surplus_{i}"

    # 6. Constrângerea 2: Acoperă exact necesarul pentru stocul minim (bounds-urile tale)
    for j in deficit:
        model += pulp.lpSum([x[(i, j)] for i in surplus]) == deficit[j], f"Exact_Deficit_{j}"

    # 7. Rezolvarea modelului (folosind solver-ul default CBC din PuLP)
    model.solve(pulp.PULP_CBC_CMD(msg=False))

    # 8. Extragerea și formatarea soluției
    if pulp.LpStatus[model.status] != 'Optimal':
        return f"Modelul nu a putut găsi o soluție optimă. Status: {pulp.LpStatus[model.status]}"

    rezultate = []
    for i in surplus:
        for j in deficit:
            cantitate = x[(i, j)].varValue
            if cantitate and cantitate > 0:
                rezultate.append(f"Trimite {int(cantitate)} unități din {i} -> către {j}")
                
    profit_estimat = pulp.value(model.objective)
    
    return rezultate, profit_estimat

# ==========================================
# TESTAREA MODELULUI CU DATE DINAMICE (MOCK)
# ==========================================
if __name__ == "__main__":
    lista_filiale = ['Bucuresti', 'Cluj', 'Iasi', 'Timisoara']
    
    # Stocul curent per filiala (aici incluzi și produsele care stau de 30 de zile)
    date_stoc_curent = {'Bucuresti': 120, 'Cluj': 15, 'Iasi': 50, 'Timisoara': 10}
    
    # Stocul minim obligatoriu (bounds)
    date_stoc_minim = {'Bucuresti': 40, 'Cluj': 30, 'Iasi': 20, 'Timisoara': 25}
    
    pret = 200 # RON pe produs
    
    # Matrice de costuri de transport între filialele cu surplus și cele cu deficit
    # În practică, aceasta se generează dinamic pe baza unei API de distanțe.
    # Aici simulăm costul mutării unui produs:
    matrice_costuri = {
        'Bucuresti': {'Cluj': 15, 'Timisoara': 20},
        'Iasi': {'Cluj': 10, 'Timisoara': 25}
    }

    plan_transfer, profit_total = optimizare_retea_stocuri(
        lista_filiale, date_stoc_curent, date_stoc_minim, pret, matrice_costuri
    )

    print("--- PLAN DE REDISTRIBUIRE ---")
    for actiune in plan_transfer:
        print(actiune)
    print(f"\nProfit net estimat din vânzarea stocului salvat: {profit_total} RON")