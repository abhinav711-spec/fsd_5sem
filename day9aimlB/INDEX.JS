// const root = ReactDOM.createRoot(document.getElementById('root'))
// const ChildComponent = ({ name }) => {
//     return (
//         <div>
//             <h1>Hello ${name}</h1>
//         </div>
//     )
// }
// const ParentComponent = ()=>{
//     return(<>
//     <ChildComponent name="Alice" />
//     <ChildComponent name="Bob" />
//     </>)
// }
// const reactelement = <ParentComponent />
// root.render(reactelement)

const root = ReactDOM.createRoot(document.getElementById('root'))
const ChildComponent = ({ name, age, user, subjects, domain, onSelect }) => {
    return (
        <article className="student-card">
            <h1>Hello {name}</h1>
            <p>Age: {age}</p>
            <p>Email: {user.email}</p>
            <p>Section: {user.section}</p>
            <h2>Subjects</h2>
            <ul>
                {subjects.map((subject) => <li key={subject}>{subject}</li>)}
            </ul>
            <p>Optional Domain: {domain}</p>
            <button onClick={onSelect}>Select {name}</button>
        </article>
    )
}
const ParentComponent = ()=>{
    const [selectedDomain, setSelectedDomain] = React.useState('all')
    const commonUserDetails = {
        section: 'B'
    }
    const user = [{
        ...commonUserDetails,
        name: 'abhinav',
        email: 'abhinav@example.com',
        password: 'password234',
        age: 21,
        domain: 'aiml'
    }, {
        ...commonUserDetails,
        name: 'Bob',
        email: 'bob@example.com',
        password: 'password654',
        section: 'A',
        age: 22,
        domain: 'cloud'
    }, {
        ...commonUserDetails,
        name: 'Charlie',
        email: 'charlie@example.com',
        age: 21,
        domain: 'blockchain'
    }, {
        ...commonUserDetails,
        name: 'Diana',
        email: 'diana@example.com',
        age: 22,
        domain: 'networking'
    }, {
        ...commonUserDetails,
        name: 'Ethan',
        email: 'ethan@example.com',
        age: 21,
        domain: 'aiml'
    }, {
        ...commonUserDetails,
        name: 'Fiona',
        email: 'fiona@example.com',
        age: 22,
        domain: 'cloud'
    }]
    const subjects = ['DAA', 'AOSC', 'OOSD', 'DBMS']
    const domains = ['aiml', 'cloud', 'blockchain', 'networking']
    const filteredUsers = selectedDomain === 'all'
        ? user
        : user.filter((student) => student.domain === selectedDomain)
    const handleSelect = (name) => alert(`${name} selected`)
    return <main className="directory">
        <div className="directory-header">
            <div>
                <p className="eyebrow">Student directory</p>
                <h1>Meet the class</h1>
            </div>
            <label className="domain-filter">
                <span>Filter by domain</span>
                <select value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)}>
                    <option value="all">All domains</option>
                    {domains.map((domain) => <option key={domain} value={domain}>{domain.toUpperCase()}</option>)}
                </select>
            </label>
        </div>
        <div className="student-grid">
            {filteredUsers.map((student) => <ChildComponent
                key={student.email}
                name={student.name}
                age={student.age}
                user={student}
                subjects={subjects}
                domain={student.domain}
                onSelect={() => handleSelect(student.name)}
            />)}
        </div>
    </main>
}
const reactelement = <ParentComponent />
root.render(reactelement)