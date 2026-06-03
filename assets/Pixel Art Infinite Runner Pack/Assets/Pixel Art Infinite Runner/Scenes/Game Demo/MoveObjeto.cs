using UnityEngine;
using System.Collections;

public class MoveObjeto : MonoBehaviour {

	
	public float speed;
	private float x;

	//animaçoes
	public Animator 				 anime;
	

	

	//tempo
	public float      timeAnimation;
	public float      timeAnimationMax;


	

	// Use this for initialization
	void Start () {
	

	}
	
	// Update is called once per frame
	void Update () {
	

		


		//vai armazenar a posiçao x atual do objeto e depositar no "x"
		x = transform.position.x;
		x += speed * Time.deltaTime;
		transform.position = new Vector3 (x, transform.position.y);


		//Destroi o objeto quando ele sai de tela
		//Destroy the object when not show on the screen
		if (x <= -1) {


			Destroy (transform.gameObject);

		}


	}
	void OnTriggerEnter2D () {


		

		
	


			



	}
}
