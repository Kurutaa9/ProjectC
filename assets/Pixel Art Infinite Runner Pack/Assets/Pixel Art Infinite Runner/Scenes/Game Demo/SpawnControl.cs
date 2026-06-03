using UnityEngine;
using System.Collections;

public class SpawnControl : MonoBehaviour {


	public GameObject ObjectPrefab;  //Objetos a ser Spawn
	

	public float rateSpawn;  // Intervalo de Spawn
	public float maxSpawn;
	

	public  float currentTime;  
	public float timeRateSpawn;   
	public float currentTimeSpawn;


	private int spawn;
	public int variableSpawn;





	void Start () {

		currentTime = 0;

		//rateSpawn = rateSpawnP;


	}
	
	// Update is called once per frame
	void Update () {


//-------------------------------------------------------------------------------------------------------------------------




		//----------------------------
		

			if (rateSpawn > maxSpawn) {
				
				currentTimeSpawn += Time.deltaTime;
				
				if (currentTimeSpawn >= timeRateSpawn) {
					
					//o cronometro zera

					currentTimeSpawn = 0;
					
					rateSpawn -= 0.1f;



					variableSpawn -= 5;

				}
				
				
				
			}



		
		//----------------------------


		//----------------------
		

				currentTime += Time.deltaTime;
				//Vai dar spawn em um objeto
				if (currentTime >= rateSpawn) {

					//o cronometro zera
					currentTime = 0;

					//Randomiza um numero entre 1 e 100
					spawn = Random.Range (1, 100);

					if (spawn >= variableSpawn) {

                     GameObject tempPrefab = Instantiate(ObjectPrefab) as GameObject;
                     tempPrefab.transform.position = new Vector3(transform.position.x, tempPrefab.transform.position.y);
                    }


				}

			
		//----------------------------
	





	
//-------------------------------------------------------------------------------------------------------------------------
}

}
