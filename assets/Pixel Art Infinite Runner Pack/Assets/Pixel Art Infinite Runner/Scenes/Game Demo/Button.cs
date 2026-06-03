using UnityEngine;
using System.Collections;
using UnityEngine.SceneManagement;

public class Button : MonoBehaviour {

	public float TempoLimite; 
	public float currentTime; 



	// Use this for initialization
	
	
	// Update is called once per frame
	public void Continuar () {
	

		
		//------------------------------------
		currentTime += Time.deltaTime;
		
		if (currentTime >= TempoLimite) 
		{
			
			
			currentTime = 0;
			SceneManager.LoadScene("GameDemo");
			
		}
		//-------------------------------



	}
}
