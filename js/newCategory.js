function showDiv(divId, element)
{   
    console.log('showDiv')
    document.getElementById(divId).style.display = element.value == "newCategory" ? 'block' : 'none';
}